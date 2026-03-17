import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TextTransformUtil } from '@shared/utils/text-transform.util';
import { ProgramsService } from '../../services/programs.service';
import type { Program } from '../../models/program.model';

@Component({
  selector: 'app-view-program',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-program.component.html',
  styleUrl: './view-program.component.css',
})
export class ViewProgramComponent implements OnInit {
  program: Program | null = null;
  loading = true;
  error = '';

  constructor(
    private readonly programsService: ProgramsService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid program ID.';
      this.loading = false;
      return;
    }
    this.programsService.getById(id).subscribe({
      next: (res) => {
        this.program = res.data ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Program not found or failed to load.';
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/programs']);
  }

  toSentenceCase(value: string | number | null | undefined): string {
    return TextTransformUtil.toSentenceCase(value != null ? String(value) : value);
  }
}
