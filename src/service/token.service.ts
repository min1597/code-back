import { Injectable } from '@nestjs/common'
import tokenPlugin from 'src/resource/plugin/token.plugin'

@Injectable()
export class TokenService {
    public tokenPlugin = tokenPlugin
}
