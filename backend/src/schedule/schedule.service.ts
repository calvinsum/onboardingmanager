import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Onboarding } from '../onboarding/entities/onboarding.entity';
import { Repository } from 'typeorm';
import Holidays from 'date-holidays';

@Injectable()
export class ScheduleService implements OnModuleInit {
  private hd: Holidays;

  constructor(
    @InjectRepository(Onboarding)
    private onboardingRepository: Repository<Onboarding>,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.hd = new Holidays('MY', '10'); // Malaysia, Selangor
  }

  getPublicHolidays(year: number, state?: string) {
    let holidayInstance = this.hd;
    if (state) {
      holidayInstance = new Holidays('MY', state);
    }
    return holidayInstance.getHolidays(year);
  }
} 