import { z } from 'zod';

export enum CandidateStatus {
    Applied = 'applied',
    Screened = 'screened',
    Interviewed = 'interviewed',
    Offered = 'offered',
    Hired = 'hired',
    Rejected = 'rejected'
}

export interface Candidate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: CandidateStatus;
    gender: string;
    ethnicity: string;
    veteranStatus: string;
    source: string;
    sourcingCost: number;
    department: string;
    hireDate?: Date;
    appliedDate: Date;
    updatedAt: Date;
}

export interface Job {
    id: string;
    title: string;
    department: string;
    location: string;
    status: 'open' | 'filled' | 'cancelled';
    postedDate: Date;
    filledDate?: Date;
    requirements: string[];
    salary: {
        min: number;
        max: number;
        currency: string;
    };
}

export const calculateDemand = (job: Job): number => {
    // Simple demand calculation based on time posted and requirements
    const daysPosted = Math.floor((Date.now() - job.postedDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(100, daysPosted * job.requirements.length / 10);
};
