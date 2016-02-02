import json
from flask import Flask, request
from flask.ext.bcrypt import Bcrypt
from wtforms import Form, TextField, PasswordField, validators
from random import randint

from Twidder import app

import database_helper

bcrypt = Bcrypt(app)

class SignUpForm(Form):
    firstName = TextField('First name', [validators.Required()])
    lastName = TextField('Last name', [validators.Required()])
    gender = TextField('Gender', [validators.Required()])
    city = TextField('City', [validators.Required()])
    country = TextField('Country', [validators.Required()])
    signupEmail = TextField('Email', [validators.Required(), validators.Email()])
    signupPassword = PasswordField('Password', [validators.Required(), validators.Length(min=6), validators.EqualTo('repeatPassword', message='Password doesn\'t match')])
    repeatPassword = PasswordField('Repeat password', [validators.Required()])

class ChangePasswordForm(Form):
    oldPassword = PasswordField('Old password', [validators.Required(), validators.Length(min=6)])
    newPassword = PasswordField('Repeat password', [validators.Required(), validators.Length(min=6), validators.EqualTo('repeatNewPassword', message='Password doesn\'t match')])
    repeatNewPassword = PasswordField('Repeat password', [validators.Required()])

@app.before_request
def beforeRequest():
    database_helper.connectToDatabase()

@app.teardown_request
def teardownRequest(exception):
    database_helper.closeDatabaseConnection()

def createToken():
    letters = 'abcdefghiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    token = ''
    for i in range(0, 36):
        token += letters[randint(0,len(letters) - 1)]
    return token

def validLogin(email, password):
    user = database_helper.getUserPasswordByEmail(email)
    if user is None:
        return False
    else:
        if bcrypt.check_password_hash(user, password):
            return True
        else:
            return False    

def emailExists(email):
    user = database_helper.getUserByEmail(email)
    if user is None:
        return False
    else:
        return True

@app.route('/')
def index():
    return app.send_static_file('client.html')

@app.route('/sign_in', methods=['POST'])
def signIn():
    if validLogin(request.form['loginEmail'], request.form['loginPassword']):
        token = createToken()
        result = database_helper.insertSignedInUser(token, request.form['loginEmail']);
        if result == True:
            return json.dumps({'success': True, 'message': 'Successfully signed in.', 'data': token}), 200
        else:
            return json.dumps({'success': False, 'message': 'Could not sign in user.'}), 501
    else:
        return json.dumps({'success': False, 'message': 'Wrong username or password.'}), 404

@app.route('/sign_up', methods=['POST'])
def signUp():
    form = SignUpForm(request.form)
    if form.validate():
        if emailExists(request.form['signupEmail']) == False:
            passwordHash = bcrypt.generate_password_hash(request.form['signupPassword'])
            result = database_helper.insertUser(request.form['signupEmail'], request.form['firstName'], request.form['lastName'], request.form['gender'], request.form['city'], request.form['country'], passwordHash)
            if result == True:            
                return json.dumps({'success': True, 'message': 'Successfully created a new user.'}), 200
            else:
                return json.dumps({'success': False, 'message': 'Could not create user.'}), 501
        else:
            return json.dumps({'success': False, 'message': 'User already exists.'}), 404
    else:
        return json.dumps({'success': False, 'message': 'Form data missing or incorrect type.'}), 404

@app.route('/sign_out/<token>', methods=['GET'])
def signOut(token):
    email = database_helper.getUserEmailByToken(token)
    if email is not None:
        result = database_helper.deleteSignedInUser(token)
        if result == True:
            return json.dumps({'success': True, 'message': 'Successfully signed out.'}), 200
        else:
            return json.dumps({'success': False, 'message': 'Could not delete signed in user.'}), 501
    else:
        return json.dumps({'success': False, 'message': 'You are not signed in.'}), 404
            
@app.route('/change_password/<token>', methods=['POST'])
def changePassword(token):
    form = ChangePasswordForm(request.form)
    if form.validate():
        email = database_helper.getUserEmailByToken(token)
        if email is not None:
            if validLogin(email, request.form['oldPassword']):
                passwordHash = bcrypt.generate_password_hash(request.form['newPassword'])
                result = database_helper.updateUserPassword(email, passwordHash)
                if result == True:
                    return json.dumps({'success': True, 'message': 'Password changed.'}), 200
                else:
                    return json.dumps({'success': False, 'message': 'Could not update password.'}), 501
            else:
                return json.dumps({'success': False, 'message': 'Wrong password.'}), 404
        else:
            return json.dumps({'success': False, 'message': 'You are not signed in.'}), 404
    else:
        return json.dumps({'success': False, 'message': 'Form data missing or incorrect type.'}), 404
            
@app.route('/get_user_data/<token>', defaults={'email': None}, methods=['GET'])
@app.route('/get_user_data/<token>/<email>', methods=['GET'])
def getUserData(token, email):
    if email is None:
        email = database_helper.getUserEmailByToken(token)

    signedInEmail = database_helper.getUserEmailByToken(token)
    if signedInEmail is not None:
        user = database_helper.getUserByEmail(email)
        if user is not None:
            userDict = {'email': user[0], 'firstName': user[1], 'lastName': user[2], 'gender': user[3], 'city': user[4], 'country': user[5]}
            return json.dumps({'success': True, 'message': 'User data retrieved.', 'data': userDict}), 200
        else:
            return json.dumps({'success': False, 'message': 'No such user.'}), 404
    else:
        return json.dumps({'success': False, 'message': 'You are not signed in.'}), 404

@app.route('/get_user_messages/<token>', defaults={'email': None}, methods=['GET'])
@app.route('/get_user_messages/<token>/<email>', methods=['GET'])
def getUserMessagesByEmail(token, email):
    if email is None:
        email = database_helper.getUserEmailByToken(token)

    signedInEmail = database_helper.getUserEmailByToken(token)
    if signedInEmail is not None:
        if emailExists(email):
            messages = database_helper.getUserMessagesByEmail(email)
            messagesList = []
            for message in messages:
                messagesList.append({'messageId': message[0], 'message': message[1], 'datePosted': message[2], 'wallEmail': message[3], 'writer': message[4]})
            return json.dumps({'success': True, 'message': 'User messages retreived.', 'data': messagesList}), 200
        else:
            return json.dumps({'success': False, 'message': 'No such user.'}), 404
    else:
        return json.dumps({'success': False, 'message': 'You are not signed in.'}), 404

@app.route('/post_message/<token>/<email>', methods=['POST'])
def postMessage(token, email):
    signedInEmail = database_helper.getUserEmailByToken(token)
    if signedInEmail is not None:
        if emailExists(email):
            if len(request.form['message']) > 0:
                database_helper.insertMessage(signedInEmail, email, request.form['message'])
                return json.dumps({'success': True, 'message': 'Message posted.'}), 200
            else:
                return json.dumps({'success': False, 'message': 'Form data missing or incorrect type.'}), 404
        else:
            return json.dumps({'success': False, 'message': 'No such user.'}), 404
    else:
        return json.dumps({'success': False, 'message': 'You are not signed in.'}), 404

