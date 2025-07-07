import { registerAs } from '@nestjs/config';
import { OnboardingType } from '../onboarding/entities/onboarding.entity';

export interface SlaConfig {
  min: number; // Minimum business days from prerequisite
  max: number; // Maximum business days from prerequisite
}

export const scheduleConfig = registerAs('schedule', () => ({
  sla: {
    [OnboardingType.HARDWARE_DELIVERY]: {
      min: 1, // e.g., Must be at least 1 business day from creation
      max: 10,
    } as SlaConfig,
    [OnboardingType.HARDWARE_INSTALLATION]: {
      min: 2, // e.g., 2-5 business days after delivery
      max: 5,
    } as SlaConfig,
    [OnboardingType.REMOTE_TRAINING]: {
      min: 1, // e.g., 1-5 business days after installation
      max: 5,
    } as SlaConfig,
    [OnboardingType.ONSITE_TRAINING]: {
      min: 3, // e.g., 3-10 business days after installation (requires more coordination)
      max: 10,
    } as SlaConfig,
  }
})); 