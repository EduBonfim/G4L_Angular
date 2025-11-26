import { Component, OnInit, OnDestroy } from '@angular/core';
import { Console } from '../../models/data.model';
import { DataService } from '../../services/data.service';
import { RentStateService } from '../../services/rent-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  // keep index for carousel
  currentIndex = 0;
  // autoplay
  private autoplayTimer: any = null;
  private readonly autoplayIntervalMs = 3500; // tempo de visualização por slide

  constructor(
    private dataService: DataService,
    private rentState: RentStateService,
    private router: Router
  ) {}

  // getter so it always reflects current consoles in storage
  get featuredConsoles(): Console[] {
    return this.dataService.getConsoles();
  }

  ngOnInit(): void {
    // start autoplay when component mounts
    this.startAutoplay();
  }

  next(): void {
    const len = this.featuredConsoles.length;
    if (len === 0) { return; }
    this.currentIndex = (this.currentIndex + 1) % len;
  }

  prev(): void {
    const len = this.featuredConsoles.length;
    if (len === 0) { return; }
    this.currentIndex = (this.currentIndex - 1 + len) % len;
  }

  goTo(i: number): void {
    if (i >= 0 && i < this.featuredConsoles.length) { this.currentIndex = i; }
  }

  startAutoplay(): void {
    this.stopAutoplay();
    if (this.featuredConsoles.length <= 1) { return; }
    this.autoplayTimer = setInterval(() => {
      this.next();
    }, this.autoplayIntervalMs);
  }

  stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  pauseAutoplay(): void { this.stopAutoplay(); }

  resumeAutoplay(): void { this.startAutoplay(); }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  selectConsole(c: Console): void {
    this.rentState.updateConsole(c.id, c.name);
    this.router.navigate(['/rent']);
  }
}