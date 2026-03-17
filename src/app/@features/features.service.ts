import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FeaturesService {
  private slugName = '';

  generateSlug(slugName: string | null | undefined): string {
    if (slugName) {
      this.slugName = slugName
        .toLowerCase()
        .trim()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replaceAll(/(^-+)|(-+$)/g, '');
      return this.slugName;
    }
    this.slugName = '';
    return this.slugName;
  }
}
