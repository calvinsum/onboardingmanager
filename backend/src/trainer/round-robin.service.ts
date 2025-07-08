import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer, TrainerStatus } from './entities/trainer.entity';
import { TrainingSlot, TrainingType, SlotStatus } from './entities/training-slot.entity';

export interface TrainerAssignmentCount {
  trainerId: string;
  trainer: Trainer;
  assignmentCount: number;
}

@Injectable()
export class RoundRobinService {
  constructor(
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
    @InjectRepository(TrainingSlot)
    private trainingSlotRepository: Repository<TrainingSlot>,
  ) {}

  /**
   * Select trainer using round-robin algorithm
   * Ensures fair distribution of training assignments
   */
  async selectTrainerRoundRobin(
    availableTrainers: Trainer[],
    date: Date,
    trainingType: TrainingType,
    timeSlot: string
  ): Promise<Trainer | null> {
    if (availableTrainers.length === 0) {
      return null;
    }

    // If only one trainer available, return that trainer
    if (availableTrainers.length === 1) {
      return availableTrainers[0];
    }

    // Get assignment counts for the current week
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    const assignmentCounts = await this.getTrainerAssignmentCounts(
      availableTrainers.map(t => t.id),
      weekStart,
      weekEnd
    );

    // Sort trainers by assignment count (ascending) and then by last assignment date
    const sortedTrainers = assignmentCounts.sort((a, b) => {
      if (a.assignmentCount !== b.assignmentCount) {
        return a.assignmentCount - b.assignmentCount;
      }
      // If assignment counts are equal, prefer trainer who hasn't been assigned recently
      return 0; // For now, just use assignment count
    });

    // Return trainer with lowest assignment count
    return sortedTrainers[0].trainer;
  }

  /**
   * Get assignment counts for trainers in a given time period
   */
  private async getTrainerAssignmentCounts(
    trainerIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<TrainerAssignmentCount[]> {
    const assignments = await this.trainingSlotRepository
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.trainer', 'trainer')
      .where('slot.trainerId IN (:...trainerIds)', { trainerIds })
      .andWhere('slot.date >= :startDate', { startDate })
      .andWhere('slot.date <= :endDate', { endDate })
      .andWhere('slot.status = :status', { status: SlotStatus.BOOKED })
      .getMany();

    // Count assignments per trainer
    const countMap = new Map<string, number>();
    assignments.forEach(assignment => {
      const count = countMap.get(assignment.trainerId) || 0;
      countMap.set(assignment.trainerId, count + 1);
    });

    // Create result array with all trainers (including those with 0 assignments)
    const result: TrainerAssignmentCount[] = [];
    
    for (const trainerId of trainerIds) {
      const trainer = await this.trainerRepository.findOne({
        where: { id: trainerId, status: TrainerStatus.ACTIVE }
      });
      
      if (trainer) {
        result.push({
          trainerId,
          trainer,
          assignmentCount: countMap.get(trainerId) || 0
        });
      }
    }

    return result;
  }

  /**
   * Get the start of the week (Monday) for a given date
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * Get the end of the week (Sunday) for a given date
   */
  private getWeekEnd(date: Date): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  /**
   * Get trainer workload statistics
   */
  async getTrainerWorkloadStats(startDate?: Date, endDate?: Date): Promise<TrainerAssignmentCount[]> {
    const start = startDate || this.getWeekStart(new Date());
    const end = endDate || this.getWeekEnd(new Date());

    const allActiveTrainers = await this.trainerRepository.find({
      where: { status: TrainerStatus.ACTIVE }
    });

    return this.getTrainerAssignmentCounts(
      allActiveTrainers.map(t => t.id),
      start,
      end
    );
  }

  /**
   * Check if trainer assignment is balanced
   * Returns true if the difference between max and min assignments is <= 1
   */
  async isAssignmentBalanced(trainerIds: string[], startDate: Date, endDate: Date): Promise<boolean> {
    const counts = await this.getTrainerAssignmentCounts(trainerIds, startDate, endDate);
    
    if (counts.length <= 1) return true;

    const assignmentCounts = counts.map(c => c.assignmentCount);
    const maxAssignments = Math.max(...assignmentCounts);
    const minAssignments = Math.min(...assignmentCounts);

    return (maxAssignments - minAssignments) <= 1;
  }
} 