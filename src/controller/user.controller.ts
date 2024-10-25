import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Request, Response, Headers, Next, HttpStatus } from '@nestjs/common'
import * as dayjs from 'dayjs'
import * as Express from 'express'
import { Password } from 'src/resource/database/entity/Password.entity'
import { Username } from 'src/resource/database/entity/Username.entity'
import { getDatabaseClient } from 'src/resource/database/main'
import { Exception } from 'src/resource/plugin/error.plugin'
import tokenPlugin from 'src/resource/plugin/token.plugin'
import userPlugin from 'src/resource/plugin/user.plugin'
import utilityPlugin from 'src/resource/plugin/utility.plugin'
import { EntityManager } from 'typeorm'
import bcrypt from 'bcrypt'

@Controller()
export class UserController {
  constructor (
  ) {  }


  @Post('v0/signin')
  async signin (@Request() _request: Express.Request, @Body() _body:
    { type: 'username_and_password', credentials: { username: string, password: string } }
    | { type: 'remote_authentication' }
  , @Response() _response: Express.Response, @Headers('authorization') _authorization: string, @Next() _next: Express.NextFunction) {
    try {
      const _sessionToken = await tokenPlugin.Session.getSummary(utilityPlugin.tokenParser(_authorization))
      if(_sessionToken.success == false) return _next(new Exception(_request, 'Failed to load session token.', HttpStatus.FORBIDDEN, _sessionToken.error))

      switch (_body.type) {
        case 'username_and_password':
          try {
            const _usernames = await getDatabaseClient().manager.getRepository(Username).find({ where: { username: _body.credentials.username, is_active: true } })
            if(_usernames.length !== 1) return _next(new Exception(_request, 'Wrong username.', HttpStatus.BAD_REQUEST, new Error()))
            
            const _userinfo = await userPlugin.User.search(_usernames[0].user_id)
            if(_userinfo.success == false) return _next(new Exception(_request, 'Failed to fetch user data.', HttpStatus.INTERNAL_SERVER_ERROR, _userinfo.error))
            
            const _passwords = await getDatabaseClient().manager.getRepository(Password).find({ where: { user_id: _userinfo.id, is_active: true } })
            if(_passwords.length !== 1) return _next(new Exception(_request, 'Failed to fetch password.', HttpStatus.INTERNAL_SERVER_ERROR, new Error()))
            
            if(bcrypt.compareSync(CryptoJS.enc.Utf8.stringify(CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(_body.credentials.password))), utilityPlugin.RSA.decode(_passwords[0].hash)) == false) return _next(new Exception(_request, 'Wrong password.', HttpStatus.BAD_REQUEST, new Error()))
            
            const _result = await _sessionToken.signin(_userinfo.id)
            if(_result.success == false) return _next(new Exception(_request, 'Failed to update token.', HttpStatus.INTERNAL_SERVER_ERROR, _result.error))

            return _response.status(200).json({ success: true, data: null, error: null, requested_at: new Date().toISOString() })
          } catch (_error) { return _next(new Exception(_request, 'Failed to authorize by username and password.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
        case 'remote_authentication':
          try {
            break
            return _response.status(200).json({ success: true, data: null, error: null, requested_at: new Date().toISOString() })
          } catch (_error) { return _next(new Exception(_request, 'Failed to authorize by username and password.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
      }
    } catch(_error) { return _next(new Exception(_request, 'An unknown error has occured.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
  }

  @Post('v0/signup')
  async signup (@Request() _request: Express.Request, @Body() _body: {
    
  }, @Response() _response: Express.Response, @Headers('authorization') _authorization: string, @Next() _next: Express.NextFunction) {
    try {
      // const _sessionToken = await this._tokenService.tokenPlugin.Session.getSummary(utilityPlugin.tokenParser(_authorization))
      // if(_sessionToken.success == false) return _next(new Exception(_request, 'Failed to load session token.', HttpStatus.FORBIDDEN, _sessionToken.error))
      // if(typeof _sessionToken.userId == 'string') return _next(new Exception(_request, 'Already signed up.', HttpStatus.BAD_REQUEST, new Error()))

      // const _signupToken = await this._tokenService.tokenPlugin.Temporary.getSummary(utilityPlugin.tokenParser(_body.signup_token))
      // if(_signupToken.success == false) return _next(new Exception(_request, 'Failed to fetch signup token.', HttpStatus.BAD_REQUEST, _signupToken.error))

      // const _accessToken = _signupToken.data as { tokenType: 'Bearer' | 'Basic', accessToken: string & { __brand: 'TOKEN' }, refreshToken: string & { __brand: 'TOKEN' }, session: string & { __brand: 'UUID' } }
      // const _userinfo = await userPlugin.oAuth.getUser(_accessToken)
      // if(_userinfo.success == false) return _next(new Exception(_request, 'Failed to fetch user data.', HttpStatus.BAD_REQUEST, _userinfo.error))

      // const _permissions = await getDatabaseClient().manager.getRepository(Permission).find({ where: { is_default: true, is_active: true } })

      // const _User = new User()
      // _User.related_id = _userinfo.id
      // _User.username = _userinfo.username
      // _User.full_name = `${ _userinfo.profile.lastName } ${ _userinfo.profile.firstName }`
      // _User.nickname = _userinfo.profile.nickname
      // _User.birthday = dayjs(_userinfo.birthday).format('YYYY-MM-DD')
      // _User.gender = _userinfo.gender == 'male' ? Gender.Male : Gender.Female
      // _User.email_address = _userinfo.emails.filter(_email => _email.isVerified)[0].emailAddress
      // _User.phone_number = _userinfo.phones.filter(_phone => _phone.isVerified)[0].phoneNumber
      // _User.permission = _permissions.map(_permission => _permission.uuid)

      // const _user = await getDatabaseClient().manager.save(_User)
      // if(_user.status == UserStatus.Normal) {
      //   const _result = await _sessionToken.signin(_user.uuid)
      //   if(_result.success == false) return _next(new Exception(_request, 'Failed to sign in.', HttpStatus.INTERNAL_SERVER_ERROR, _result.error))
      // }

      return _response.status(200).json({ success: true, data: null, error: null, requested_at: new Date().toISOString() })
    } catch(_error) { return _next(new Exception(_request, 'An unknown error has occured.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
  }
  
  @Get('v0/userinfo')
  async userinfo (@Request() _request: Express.Request, @Response() _response: Express.Response, @Headers('authorization') _authorization: string, @Next() _next: Express.NextFunction) {
    try {
      // const _sessionToken = await tokenPlugin.Session.getSummary(utilityPlugin.tokenParser(_authorization))
      // if(_sessionToken.success == false) return _next(new Exception(_request, 'Failed to load session token.', HttpStatus.FORBIDDEN, _sessionToken.error))

      // if(typeof _sessionToken.userIds !== 'string') return _next(new Exception(_request, 'Not authenticated.', HttpStatus.UNAUTHORIZED, new Error()))

      // const _userinfo = await userPlugin.User.search(_sessionToken.userIds)
      // if(_userinfo.success == false) return _next(new Exception(_request, 'Failed to fetch user data.', HttpStatus.INTERNAL_SERVER_ERROR, _userinfo.error))

      // return _response.status(200).json({ success: true, data: {
      //   id: _userinfo.id,

      //   full_name: _userinfo.fullName,
      //   nickname: _userinfo.nickname,
      //   username: _userinfo.username,

      //   phone_number: _userinfo.phoneNumber,
      //   email_address: _userinfo.emailAddress
      // }, error: null, requested_at: new Date().toISOString() })
    } catch(_error) { console.log(_error); return _next(new Exception(_request, 'An unknown error has occured.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
  }
}
