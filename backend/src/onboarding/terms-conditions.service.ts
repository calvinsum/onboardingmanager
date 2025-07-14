import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TermsConditions } from './entities/terms-conditions.entity';

@Injectable()
export class TermsConditionsService {
  constructor(
    @InjectRepository(TermsConditions)
    private termsConditionsRepository: Repository<TermsConditions>,
  ) {}

  async createTermsConditions(version: string, content: string, effectiveDate: Date): Promise<TermsConditions> {
    // Deactivate all previous versions
    await this.termsConditionsRepository.update(
      { isActive: true },
      { isActive: false }
    );

    // Create new version
    const termsConditions = this.termsConditionsRepository.create({
      version,
      content,
      effectiveDate,
      isActive: true,
    });

    return this.termsConditionsRepository.save(termsConditions);
  }

  async getActiveTermsConditions(): Promise<TermsConditions> {
    const activeTerms = await this.termsConditionsRepository.findOne({
      where: { isActive: true },
    });

    if (!activeTerms) {
      throw new NotFoundException('No active terms and conditions found');
    }

    return activeTerms;
  }

  async getAllTermsConditions(): Promise<TermsConditions[]> {
    return this.termsConditionsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getTermsConditionsById(id: string): Promise<TermsConditions> {
    const terms = await this.termsConditionsRepository.findOne({
      where: { id },
    });

    if (!terms) {
      throw new NotFoundException('Terms and conditions not found');
    }

    return terms;
  }

  async updateTermsConditions(id: string, content: string): Promise<TermsConditions> {
    const terms = await this.getTermsConditionsById(id);
    
    terms.content = content;
    
    return this.termsConditionsRepository.save(terms);
  }

  async activateTermsConditions(id: string): Promise<TermsConditions> {
    // Deactivate all versions
    await this.termsConditionsRepository.update(
      { isActive: true },
      { isActive: false }
    );

    // Activate the specified version
    const terms = await this.getTermsConditionsById(id);
    terms.isActive = true;
    
    return this.termsConditionsRepository.save(terms);
  }
} 