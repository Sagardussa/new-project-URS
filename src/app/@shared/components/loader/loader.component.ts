import { Component, OnDestroy } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, timer, map, switchMap, startWith } from 'rxjs';
import { LoaderService } from '@core';
import { PageSpinnerComponent } from '../page-spinner/page-spinner.component';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.css'],
    imports: [CommonModule, AsyncPipe, PageSpinnerComponent]
})
export class LoaderComponent implements OnDestroy {
  isLoading$: Observable<boolean>;
  shouldShow$: Observable<boolean>;
  
  // Theme color options - choose one:
  themeColor = '#192537';  // Dark blue/navy 
  // themeColor = '#13518f';  // Secondary blue
  // themeColor = '#3760B0';  // Lighter blue

  private readonly showSubject = new BehaviorSubject<boolean>(false);

  constructor(private readonly loaderService: LoaderService) {
    this.isLoading$ = this.loaderService.loading$;
    
    // Control when to show/hide the loader element for smooth transitions
    this.shouldShow$ = this.isLoading$.pipe(
      switchMap(isLoading => {
        if (isLoading) {
          this.showSubject.next(true);
          return [true];
        } else {
          // Delay hiding the element to allow fade-out animation
          return timer(300).pipe(
            map(() => {
              this.showSubject.next(false);
              return false;
            }),
            startWith(true)
          );
        }
      })
    );
  }

  ngOnDestroy() {
    this.showSubject.complete();
  }
}
