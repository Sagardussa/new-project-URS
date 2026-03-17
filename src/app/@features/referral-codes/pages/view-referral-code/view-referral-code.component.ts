import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SharedModule } from '@shared';
import { ReferralCodesService } from '../../services/referral-codes.service';
import { ReferralService } from '@features/referral/services/referral.service';
import type { ReferralCode } from '../../models/referral-code.model';

/** Referral event from journey API (by code) */
interface ReferralEvent {
  id?: number;
  uuid?: string;
  referralId?: number;
  eventType?: string;
  metadata?: unknown;
  rewardsTriggered?: string[];
  occurredAt?: string | null;
}

/** Program reward stage */
interface ProgramReward {
  id?: number;
  uuid?: string;
  stageNumber?: number;
  stageName?: string;
  triggerEvent?: string;
  rewardType?: string;
  rewardValue?: string;
}

/** Actual reward granted for a completed referral event */
interface ReferralReward {
  id?: number;
  referralId?: number;
  rewardType?: string;
  rewardValue?: string;
  triggerEvent?: string;
}

/** Referral entry from journey API (by code) */
interface ReferralEntry {
  id?: number;
  uuid?: string;
  createdAt?: string;
  updatedAt?: string;
  programId?: number;
  program?: { id?: number; uuid?: string; name?: string; programRewards?: ProgramReward[] };
  referralCodeId?: number;
  referrerUserId?: string;
  referrerUserType?: string;
  refereeUserId?: string;
  refereeUserType?: string;
  status?: string;
  lifecycleStage?: string;
  totalRewardsEarned?: number;
  attributionData: { uuid?: string; refereeEmail?: string; onboardingTimestamp?: string };
  completedAt?: string | null;
  lastEventAt?: string;
  referralEvents?: ReferralEvent[];
  rewards?: ReferralReward[];
}

/** Stage + optional event for timeline (from program.programRewards + referralEvents) */
interface StageWithEvent {
  stageNumber: number;
  stageName: string;
  triggerEvent: string;
  rewardValue: number;
  event?: ReferralEvent;
}

@Component({
  selector: 'app-view-referral-code',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './view-referral-code.component.html',
  styleUrl: './view-referral-code.component.css',
})
export class ViewReferralCodeComponent implements OnInit {
  referralCode: ReferralCode | null = null;
  loading = true;
  error = '';

  /** Tab: 'basic' = Basic Info (default), 'journey' = Referral Journey */
  activeTab: 'basic' | 'journey' = 'basic';

  /** Referral journey state (for Referral Journey tab) */
  referrals: ReferralEntry[] = [];
  referralsLoading = false;
  journeyTotalReferrals = 0;
  journeyRewardsEarned = 0;
  /** Pagination for journey list: meta from API (total, page, limit) */
  journeyPage = 1;
  journeyLimit = 10;
  journeyTotal = 0;
  tooltipVisible: { x: number; y: number; points: number } | null = null;

  constructor(
    private readonly referralCodesService: ReferralCodesService,
    private readonly referralService: ReferralService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const stateData = (globalThis.history.state as { referralCodeData?: ReferralCode } | null) || null;
    if (stateData?.referralCodeData) {
      this.referralCode = stateData.referralCodeData;
      this.loading = false;
    } else {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) {
        this.error = 'Invalid referral code ID.';
        this.loading = false;
        return;
      }
      this.error = 'Referral code data not available. Please navigate from the list page.';
      this.loading = false;
    }
  }

  setTab(tab: 'basic' | 'journey'): void {
    this.activeTab = tab;
    if (tab === 'journey' && this.referralCode?.code && !this.referralsLoading) {
      this.loadReferralJourney();
    }
  }

  loadReferralJourney(): void {
    const code = this.referralCode?.code;
    if (!code) return;
    this.referralsLoading = true;

    this.referralService.getAdminStatsByCode(code).subscribe({
      next: (stats) => {
        if (stats?.data) {
          this.journeyTotalReferrals = stats.data.totalReferralCount ?? 0;
          this.journeyRewardsEarned = stats.data.totalRewardPointsSum ?? 0;
        } else {
          this.journeyTotalReferrals = 0;
          this.journeyRewardsEarned = 0;
        }
      },
      error: () => {
        this.journeyTotalReferrals = 0;
        this.journeyRewardsEarned = 0;
      },
    });

    this.referralService.getReferralJourneyByCode(code, this.journeyPage, this.journeyLimit).subscribe({
      next: (response) => {
        if (response?.data) {
          const data = response.data as Record<string, unknown>;
          const recordList = data['record'] as Record<string, unknown>[] | undefined;
          this.referrals = Array.isArray(recordList)
            ? recordList.map((record: Record<string, unknown>) => this.mapRecordToEntry(record))
            : [];
          const meta = data['meta'] as { total?: number; page?: number; limit?: number } | undefined;
          if (meta) {
            this.journeyTotal = meta.total ?? 0;
            this.journeyPage = meta.page ?? this.journeyPage;
            this.journeyLimit = meta.limit ?? this.journeyLimit;
          }
        } else {
          this.referrals = [];
        }
        this.referralsLoading = false;
      },
      error: () => {
        this.referrals = [];
        this.referralsLoading = false;
      },
    });
  }

  /** Go to a specific page in the referral journey list */
  goToJourneyPage(page: number): void {
    if (page < 1 || page > this.getJourneyTotalPages()) return;
    this.journeyPage = page;
    this.loadReferralJourney();
  }

  getJourneyTotalPages(): number {
    if (this.journeyLimit <= 0) return 0;
    return Math.ceil(this.journeyTotal / this.journeyLimit) || 1;
  }

  getJourneyRangeLabel(): string {
    if (this.journeyTotal === 0) return '0';
    const start = (this.journeyPage - 1) * this.journeyLimit + 1;
    const end = Math.min(this.journeyPage * this.journeyLimit, this.journeyTotal);
    return `${start}–${end} of ${this.journeyTotal}`;
  }

  private mapRecordToEntry(record: Record<string, unknown>): ReferralEntry {
    const att = (record['attributionData'] as Record<string, unknown>) || {};
    const program = record['program'] as ReferralEntry['program'];
    const events = (record['referralEvents'] as ReferralEvent[] | undefined) || [];
    const rewards = (record['rewards'] as ReferralReward[] | undefined) || [];
    return {
      id: record['id'] as number,
      uuid: record['uuid'] as string,
      createdAt: record['createdAt'] as string,
      updatedAt: record['updatedAt'] as string,
      programId: record['programId'] as number,
      program,
      referralCodeId: record['referralCodeId'] as number,
      referrerUserId: record['referrerUserId'] as string,
      referrerUserType: record['referrerUserType'] as string,
      refereeUserId: record['refereeUserId'] as string,
      refereeUserType: record['refereeUserType'] as string,
      status: record['status'] as string,
      lifecycleStage: record['lifecycleStage'] as string,
      totalRewardsEarned: record['totalRewardsEarned'] as number,
      attributionData: {
        uuid: att['uuid'] as string,
        refereeEmail: att['refereeEmail'] as string,
        onboardingTimestamp: att['onboardingTimestamp'] as string,
      },
      completedAt: record['completedAt'] as string | null,
      lastEventAt: record['lastEventAt'] as string,
      referralEvents: events,
      rewards,
    };
  }

  /** Build timeline from program.programRewards; match triggerEvent with referralEvents (completed) and use actual rewardValue from referral.rewards. Pending stages show 0 pts. */
  getStagesWithEvents(referral: ReferralEntry): StageWithEvent[] {
    const programRewards = referral?.program?.programRewards;
    if (programRewards?.length) {
      const stages = programRewards.map((pr) => {
        const event = referral.referralEvents?.find((e) => e.eventType === pr.triggerEvent);
        const isCompleted = !!(event?.occurredAt);
        // Only show points for completed stages: use actual reward from referral.rewards (matched by triggerEvent), not program's configured value
        const actualReward = referral.rewards?.find((r) => r.triggerEvent === pr.triggerEvent);
        const rewardValue = isCompleted && actualReward?.rewardValue != null
          ? Number(actualReward.rewardValue)
          : 0;
        return {
          stageNumber: pr.stageNumber ?? 0,
          stageName: pr.stageName ?? this.getEventStageLabel(pr.triggerEvent ?? ''),
          triggerEvent: pr.triggerEvent ?? '',
          rewardValue: Number.isNaN(rewardValue) ? 0 : rewardValue,
          event,
        };
      });
      return stages.slice().sort((a, b) => a.stageNumber - b.stageNumber);
    }
    const fromEvents = (referral.referralEvents ?? []).map((e, i) => {
      const actualReward = referral.rewards?.find((r) => r.triggerEvent === e.eventType);
      const raw = actualReward?.rewardValue;
      const rewardValue = raw === undefined || raw === null ? 0 : Number(raw);
      return {
        stageNumber: i + 1,
        stageName: this.getEventStageLabel(e.eventType ?? ''),
        triggerEvent: e.eventType ?? '',
        rewardValue: Number.isNaN(rewardValue) ? 0 : rewardValue,
        event: e,
      };
    });
    return fromEvents.slice().sort((a, b) => a.stageNumber - b.stageNumber);
  }

  goBack(): void {
    this.router.navigate(['/referral-codes']);
  }

  // --- Journey tab helpers ---
  journeyUserId(): string {
    return this.referralCode?.code ?? '';
  }

  getInitials(text: string): string {
    if (!text) return '';
    const parts = String(text).split('@')[0].split(/[.\-_]/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return text.substring(0, 2).toUpperCase();
  }

  journeySummaryCards(): { label: string; value: string | number; showCoin: boolean }[] {
    return [
      { label: 'Total Referrals', value: this.journeyTotalReferrals, showCoin: false },
      { label: 'Rewards Earned', value: this.journeyRewardsEarned, showCoin: true },
    ];
  }

  /** Count for "Referral History — X person referred"; prefer list meta total, else stats. */
  totalReferralsCount(): number {
    return this.journeyTotal > 0 ? this.journeyTotal : this.journeyTotalReferrals;
  }

  getAvatarColor(index: number): { bg: string; text: string } {
    const colors = [
      { bg: 'bg-blue-500', text: 'text-white' },
      { bg: 'bg-green-500', text: 'text-white' },
      { bg: 'bg-purple-500', text: 'text-white' },
      { bg: 'bg-orange-500', text: 'text-white' },
      { bg: 'bg-pink-500', text: 'text-white' },
      { bg: 'bg-indigo-500', text: 'text-white' },
    ];
    return colors[index % colors.length];
  }

  getStatusLabel(status: string): string {
    const m: Record<string, string> = {
      ACTIVE: 'Active', INACTIVE: 'Inactive', PENDING: 'Pending', COMPLETED: 'Completed',
      active: 'Active', inactive: 'Inactive', pending: 'Pending', completed: 'Completed',
    };
    return m[status] ?? status;
  }

  getStatusBadgeClass(status: string): string {
    const u = (status || '').toUpperCase();
    if (u === 'ACTIVE') return 'bg-green-100 text-green-700';
    if (u === 'COMPLETED') return 'bg-blue-100 text-blue-700';
    if (u === 'PENDING') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  }

  /** Total points earned by referrer from this referral (sum of completed event rewards). */
  getRefereePointsEarned(referral: ReferralEntry): number {
    const fromStages = this.getStagesWithEvents(referral)
      .filter((row) => this.isStageCompleted(row))
      .reduce((sum, row) => sum + row.rewardValue, 0);
    return fromStages > 0 ? fromStages : (referral?.totalRewardsEarned ?? 0);
  }

  isStageCompleted(row: StageWithEvent): boolean {
    return !!(row.event?.occurredAt);
  }

  getCompletedEventsCount(referral: ReferralEntry): number {
    return this.getStagesWithEvents(referral).filter((row) => this.isStageCompleted(row)).length;
  }

  getTotalEventsCount(referral: ReferralEntry): number {
    return this.getStagesWithEvents(referral).length;
  }

  calculateProgress(completed: number, total: number): number {
    return total ? Math.round((completed / total) * 100) : 0;
  }

  getEventStageLabel(eventType: string): string {
    const m: Record<string, string> = {
      'referee.signup.completed': 'Signup Completed',
      'referee.onboarding.completed': 'Onboarding Completed',
      'referee.profile.completed': 'Profile Completed',
      'referee.first.purchase': 'First Purchase',
      'referee.first.job.created': 'First Job Created',
      'referee.review.submitted': 'Review Submitted',
      'referee.referral.made': 'Referral Made',
      SIGNUP: 'Signup Completed', PROFILE_COMPLETE: 'Profile Complete',
      FIRST_PURCHASE: 'First Purchase', REVIEW_SUBMITTED: 'Review Submitted', REFERRAL_MADE: 'Referral Made',
    };
    return m[eventType] ?? eventType;
  }

  showEventTooltip(ev: MouseEvent, _eventUuid: string, points: number): void {
    this.tooltipVisible = { x: ev.clientX, y: ev.clientY - 40, points };
  }

  hideEventTooltip(): void {
    this.tooltipVisible = null;
  }

  /** Hide tooltip when user scrolls so it doesn't stay fixed while content moves */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.hideEventTooltip();
  }
}
