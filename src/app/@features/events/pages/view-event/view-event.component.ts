import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-view-event',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-event.component.html',
  styleUrl: './view-event.component.css',
})
export class ViewEventComponent {
  event: Event | null = null;
  loading = true;
  error = '';

  constructor(
    private readonly eventsService: EventsService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}


  goBack(): void {
    this.router.navigate(['/events']);
  }

 
}
