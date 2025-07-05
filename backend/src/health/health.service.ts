import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private connection: Connection,
  ) {}

  async check() {
    const startTime = Date.now();
    
    try {
      // Check database connectivity
      await this.connection.query('SELECT 1');
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'connected',
        responseTime: Date.now() - startTime,
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
        environment: process.env.NODE_ENV || 'development',
      };
    }
  }

  async readiness() {
    try {
      // Check if database is ready
      await this.connection.query('SELECT 1');
      
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'ready',
      };
    } catch (error) {
      throw new Error('Service not ready');
    }
  }

  async liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
} 