import { Controller, Get, HttpException, Next, Request, Response } from '@nestjs/common'
import { AppService } from '../service/app.service'
import Express, { NextFunction } from 'express'
import { Exception } from 'src/resource/plugin/error.plugin'

@Controller()
export class AppController {
  constructor (private readonly _appService: AppService) {

  }

}
