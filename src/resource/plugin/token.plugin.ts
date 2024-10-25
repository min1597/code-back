import axios from 'axios'
import { Token, TokenMethod, TokenStatus } from '../database/entity/Token.entity'
import { getDatabaseClient } from '../database/main'
import utilityPlugin from './utility.plugin'
import tokenPlugin from './token.plugin'
import CryptoJS from 'crypto-js'
import * as dayjs from 'dayjs'
import userPlugin from './user.plugin'

const _validHours: { [ tokenType in TokenMethod ]: number } = { 'SESSION_TOKEN': 168, 'TEMPORARY_TOKEN': 1 }

export default {
    pluginName: 'tokenPlugin',
    
    Idempotency: {
        getRequestRecords: async (_key: string): Promise<
            { success: true, records: Array<{ path: string, success: boolean }> }
            | { success: false, error?: Error }
        > => {
            return { success: false, error: new Error('This function was not supported.') }
        }
    },
    Session: {
        createSession: async (_options: { ipAddress: string, agent: string }): Promise<
            { success: true, token: string & { __brand: 'TOKEN' }, tokenType: 'Bearer' | 'Basic' }
            | { success: false, error?: Error }
        > => {
            try {
                let _randomString: string & { __brand: 'TOKEN' } = '' as string & { __brand: 'TOKEN' }
                while (true) {
                  _randomString = utilityPlugin.getRandomStrings(128, 'abcdefghijklnmopqrstuvwxyzABCDEFGHIJKLNMOPQRSTUVWXYZ0123456789_-') as string & { __brand: 'TOKEN' }
                  if((await getDatabaseClient().manager.getRepository(Token).find({ where: { token: _randomString } })).length == 0) break
                }

                const _Token = new Token()
                _Token.token = _randomString
                _Token.token_method = TokenMethod.SESSION_TOKEN
                _Token.valid_time = String(_validHours[_Token.token_method] * 60 * 60 * 1000)
                _Token.ip_address = _options.ipAddress
                _Token.client_agent = _options.agent

                const _token = await getDatabaseClient().manager.save(_Token)

                return { success: true, token: _token.token, tokenType: 'Bearer' }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
        validateSession: async (_token: string & { __brand: 'TOKEN' }, _tokenType: 'Bearer' | 'Basic', _options?: { ipAddress?: string, agent?: string }): Promise<
            { success: true }
            | { success: false, error?: Error }
        > => {
            try {
                const _tokens = await getDatabaseClient().manager.getRepository(Token).find({ where: { token: (_tokenType == 'Basic' ? CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(_token)).toString().split(':')[1] : _token) as string & { __brand: 'TOKEN' }, token_method: TokenMethod.SESSION_TOKEN, is_active: true } })
                if(_tokens.length !== 1) return { success: false, error: new Error('Wrong token.') }
                if(dayjs(_tokens[0].created_date).add(Number(_tokens[0].valid_time), 'milliseconds').diff() <= 0) {
                    await getDatabaseClient().manager.getRepository(Token).update({ uuid: _tokens[0].uuid }, { status: TokenStatus.Expired })
                    return { success: false, error: new Error('Expired token.') }
                }
                if(_options) {
                    if(_options.ipAddress) {
                        if(_tokens[0].ip_address !== _options.ipAddress) return { success: false, error: new Error('Invalid device.') }
                    }
                    if(_options.agent) {
                        if(_tokens[0].client_agent !== _options.agent) return { success: false, error: new Error('Invalid device.') }
                    }
                }
                return { success: true }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
        getSummary: async (_token: { token: string & { __brand: 'TOKEN' }, tokenType: 'Bearer' | 'Basic' }): Promise<
            {
                success: true,
                token: string & { __brand: 'TOKEN' },
                tokenType: 'Bearer' | 'Basic',
                id: string & { __brand: 'UUID' },
                userIds: Array<string & { __brand: 'UUID' }> | null,
                expiresDate: Date,
                signin: (_userId: string & { __brand: 'UUID' }) => Promise<{ success: true } | { success: false, error?: Error }>,
                signout: (_userId: string & { __brand: 'UUID' }) => Promise<{ success: true } | { success: false, error?: Error }>
            }
            | { success: false, error?: Error }
        > => {
            try {
                const _tokens = await getDatabaseClient().manager.getRepository(Token).find({ where: { token: (_token.tokenType == 'Basic' ? CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(_token.token)).toString().split(':')[1] : _token.token) as string & { __brand: 'TOKEN' }, token_method: TokenMethod.SESSION_TOKEN, is_active: true } })
                if(_tokens.length !== 1) return { success: false, error: new Error('Wrong token.') }
                if(dayjs(_tokens[0].created_date).add(Number(_tokens[0].valid_time), 'milliseconds').diff() <= 0) {
                    await getDatabaseClient().manager.getRepository(Token).update({ uuid: _tokens[0].uuid }, { status: TokenStatus.Expired })
                    return { success: false, error: new Error('Expired token.') }
                }
                
                return {
                    success: true,
                    ... _token,
                    id: _tokens[0].uuid,
                    userIds: _tokens[0].user_id,
                    expiresDate: dayjs(_tokens[0].created_date).add(Number(_tokens[0].valid_time), 'milliseconds').toDate(),
                    signin: async (_userId: string & { __brand: 'UUID' }) => {
                        try {
                            if(_tokens[0].user_id !== null) return { success: false, error: new Error('Already signed in.') }
                            const _userinfo = await userPlugin.User.search(_userId)
                            if(_userinfo.success == false) return { success: false, error: new Error('Failed load user.', { cause: _userinfo.error }) }
                            await getDatabaseClient().manager.getRepository(Token).update({ uuid: _tokens[0].uuid, is_active: true }, { user_id: Array.from(new Set([ ... _tokens[0].user_id, _userinfo.id ])) })

                            return { success: true }
                        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                    },
                    signout: async (_userId: string & { __brand: 'UUID' }) => {
                        try {
                            if((_tokens[0].user_id ?? [  ]).includes(_userId) == false) return { success: false, error: new Error('Wrong user id.') }
                            const _userIds = _tokens[0].user_id.filter(_id => _id !== _userId)
                            await getDatabaseClient().manager.getRepository(Token).update({ uuid: _tokens[0].uuid, is_active: true }, { user_id: _userIds.length == 0 ? null : _userIds })

                            return { success: true }
                        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                    }
                }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
    },
    Temporary: {
        createToken: async (_data: object, _options?: { userId?: string }): Promise<
            { success: true, token: string & { __brand: 'TOKEN' }, tokenType: 'Bearer' | 'Basic', expiresDate: Date }
            | { success: false, error?: Error }
        > => {
            try {
                let _randomString: string & { __brand: 'TOKEN' } = '' as string & { __brand: 'TOKEN' }
                while (true) {
                  _randomString = utilityPlugin.getRandomStrings(128, 'abcdefghijklnmopqrstuvwxyzABCDEFGHIJKLNMOPQRSTUVWXYZ0123456789_-') as string & { __brand: 'TOKEN' }
                  if((await getDatabaseClient().manager.getRepository(Token).find({ where: { token: _randomString } })).length == 0) break
                }

                const _Token = new Token()
                _Token.token = _randomString
                _Token.token_method = TokenMethod.TEMPORARY_TOKEN
                _Token.valid_time = String(_validHours[_Token.token_method] * 60 * 60 * 1000)
                _Token.data = _data

                if(_options) {
                    if(_options.userId) {
                        _Token.user_id = [ utilityPlugin.validateUUID(_options.userId) ]
                    }
                }

                const _token = await getDatabaseClient().manager.save(_Token)

                return { success: true, token: _token.token, tokenType: 'Bearer', expiresDate: dayjs(_token.created_date).add(Number(_token.valid_time), 'milliseconds').toDate() }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
        getSummary: async (_token: { token: string & { __brand: 'TOKEN' }, tokenType: 'Bearer' | 'Basic' }, _options?: { userId?: string }): Promise<
            { success: true, id: string & { __brand: 'UUID' }, data?: object }
            | { success: false, error?: Error }
        > => {
            try {
                const _tokens = await getDatabaseClient().manager.getRepository(Token).find({ where: { token: (_token.tokenType == 'Basic' ? CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(_token.token)).toString().split(':')[1] : _token.token) as string & { __brand: 'TOKEN' }, token_method: TokenMethod.TEMPORARY_TOKEN, is_active: true } })
                if(_tokens.length !== 1) return { success: false, error: new Error('Wrong token.') }
                if(dayjs(_tokens[0].created_date).add(Number(_tokens[0].valid_time), 'milliseconds').diff() <= 0) {
                    await getDatabaseClient().manager.getRepository(Token).update({ uuid: _tokens[0].uuid }, { status: TokenStatus.Expired })
                    return { success: false, error: new Error('Expired token.') }
                }
                if(_options) {
                    if(_options.userId) {
                        if(_tokens[0].user_id !== null && _tokens[0].user_id[0] !== _options.userId) return { success: false, error: new Error('Invalid user.') }
                    }
                }
                return { success: true, id: _tokens[0].uuid, data: _tokens[0].data }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
    },
    Authorization: {
        
    },
    revoke: async (_token: { token: string & { __brand: 'TOKEN' }, tokenType: 'Bearer' | 'Basic' }): Promise<
        { success: true }
        | { success: false, error?: Error }
    > => {
        try {
            const _tokens = await getDatabaseClient().manager.getRepository(Token).find({ where: { token: (_token.tokenType == 'Basic' ? CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(_token.token)).toString().split(':')[1] : _token.token) as string & { __brand: 'TOKEN' }, is_active: true } })
            if(_tokens.length !== 1) return { success: false, error: new Error('Wrong token.') }
            if(dayjs(_tokens[0].created_date).add(Number(_tokens[0].valid_time), 'milliseconds').diff() <= 0) {
                await getDatabaseClient().manager.getRepository(Token).update({ uuid: _tokens[0].uuid }, { status: TokenStatus.Expired })
                return { success: false, error: new Error('Expired token.') }
            }
            await getDatabaseClient().manager.getRepository(Token).update({ uuid: _tokens[0].uuid }, { is_active: false, deleted_date: new Date() })

            return { success: true }
        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
    }
}