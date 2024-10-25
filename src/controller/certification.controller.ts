import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Request, Response, Headers, Next, HttpStatus } from '@nestjs/common'
import * as dayjs from 'dayjs'
import * as Express from 'express'
import { User, UserStatus } from 'src/resource/database/entity/User.entity'
import { Exception } from 'src/resource/plugin/error.plugin'
import userPlugin from 'src/resource/plugin/user.plugin'
import utilityPlugin from 'src/resource/plugin/utility.plugin'
import { TokenService } from 'src/service/token.service'
import { EntityManager } from 'typeorm'
import * as useragent from 'useragent'
import * as CryptoJS from 'crypto-js'
import { getDatabaseClient } from 'src/resource/database/main'
import { Permission } from 'src/resource/database/entity/Permission.entity'
import tokenPlugin from 'src/resource/plugin/token.plugin'
import certificationPlugin from 'src/resource/plugin/certification.plugin'

@Controller()
export class CertificationController {
    constructor (
        
    ) { }

    @Post('v0/certification')
    async create (@Request() _request: Express.Request, @Body() _body: {
        type: 'phone_number' | 'email_address',
        target: string
    }, @Response() _response: Express.Response, @Headers('authorization') _authorization: string, @Next() _next: Express.NextFunction) {
        try {
            const _sessionToken = await tokenPlugin.Session.getSummary(utilityPlugin.tokenParser(_authorization))
            if(_sessionToken.success == false) return _next(new Exception(_request, 'Failed to load session token.', HttpStatus.FORBIDDEN, _sessionToken.error))
            
            const _certification = await certificationPlugin.Certification.create({ phone_number: 'phoneNumber', email_address: 'emailAddress' }[_body.type] as 'phoneNumber' | 'emailAddress', _body.target)
            if(_certification.success == false) return _next(new Exception(_request, 'Failed to request certification.', HttpStatus.BAD_REQUEST, _certification.error))
            
            return _response.status(200).json({ success: true, data: {
                id: _certification.id,
                expires_at: _certification.expiresDate.toISOString()
            }, error: null, requested_at: new Date().toISOString() })
        } catch(_error) { return _next(new Exception(_request, 'An unknown error has occured.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
    }

    @Post('v0/certification/:certificationId/validate')
    async validate (@Request() _request: Express.Request, @Body() _body: {
        code: string
    }, @Param('certificationId') _certificationId: string, @Response() _response: Express.Response, @Headers('authorization') _authorization: string, @Next() _next: Express.NextFunction) {
        try {
            const _sessionToken = await tokenPlugin.Session.getSummary(utilityPlugin.tokenParser(_authorization))
            if(_sessionToken.success == false) return _next(new Exception(_request, 'Failed to load session token.', HttpStatus.FORBIDDEN, _sessionToken.error))
            try {
                utilityPlugin.validateUUID(_certificationId)
            } catch(_error) { return _next(new Exception(_request, 'Wrong certification id.', HttpStatus.BAD_REQUEST, new Error())) }

            const _certification = await certificationPlugin.Certification.find(utilityPlugin.validateUUID(_certificationId))
            if(_certification.success == false) return _next(new Exception(_request, 'Failed to request certification.', HttpStatus.BAD_REQUEST, _certification.error))
            
            const _result = await _certification.Process.verify(_body.code)
            if(_result.success == false) return _next(new Exception(_request, _result.error.message, HttpStatus.BAD_REQUEST, _result.error))
            
            return _response.status(200).json({ success: true, data: null, error: null, requested_at: new Date().toISOString() })
        } catch(_error) { return _next(new Exception(_request, 'An unknown error has occured.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
    }
}