import { ComponentFixture, TestBed } from "@angular/core/testing"

import { TimeZoneListItemComponent } from "./time-zone-list-item.component"

describe("TimeZoneListItemComponent", () => {
  let component: TimeZoneListItemComponent
  let fixture: ComponentFixture<TimeZoneListItemComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeZoneListItemComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(TimeZoneListItemComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })
})
