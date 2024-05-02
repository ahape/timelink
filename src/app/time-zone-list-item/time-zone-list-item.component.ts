import { Component, Input, OnInit } from '@angular/core';
import { TimeZoneInfo } from '../timeZoneInfo';

@Component({
  selector: '[app-time-zone-list-item]',
  standalone: true,
  imports: [],
  templateUrl: './time-zone-list-item.component.html',
  styleUrl: './time-zone-list-item.component.css'
})
export class TimeZoneListItemComponent implements OnInit {
  @Input() timeZoneInfo!: TimeZoneInfo;

  ngOnInit() {

  }
}
