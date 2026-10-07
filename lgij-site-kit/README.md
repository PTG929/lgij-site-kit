# Let's Get It Jumping site kit

Finished, self-contained web components for the Let's Get It Jumping website, built by 757Comply. Each file carries its own art, styles, sounds, and logic inside a shadow root, so the host site cannot restyle it.

## Components

| File | Element | What it is |
| --- | --- | --- |
| `dist/lgij-party-builder.min.js` | `<lgij-party-builder>` | The Party Builder booking flow: backyard stage, balloon calendar, sun slider, lemonade-stand total, details, pay choice, held view, and the group request form |

## Install (do not edit the file)

```sh
mkdir -p public/lgij
curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/v1.0.0/dist/lgij-party-builder.min.js -o public/lgij/lgij-party-builder.min.js
sha256sum public/lgij/lgij-party-builder.min.js   # must match CHECKSUMS.txt
```

Serve it as a static file and load it once per page:

```html
<script src="/lgij/lgij-party-builder.min.js" defer></script>
```

## Mount

```html
<lgij-party-builder api-base="/api/party" style="--lgij-sticky-top: 92px; --lgij-sticky-top-mobile: 64px">
  <script type="application/json" data-lgij-config>{ ...config... }</script>
  <div class="lgij-fallback">Plain HTML for crawlers and no-JS visitors: bouncer names, prices, how to book.</div>
</lgij-party-builder>
```

The fallback stays in the server HTML for search engines and is hidden once the component starts.

### Attributes

| Attribute | Meaning |
| --- | --- |
| `api-base` | Base path for the three API routes. Default `/api/party` |
| `demo` | Pretend dates and pretend bookings. Nothing is sent anywhere |
| `preselect` | A unit slug to start with already in the yard. `?unit=slug` in the page URL does the same |
| `controls` | Shows the component's own Sound, Calm, and demo buttons (for standalone demos only) |
| `sound`, `calm`, `palette` | Per-element overrides of the page-level settings below |

### CSS custom properties

| Property | Meaning |
| --- | --- |
| `--lgij-sticky-top` | Where the stage sticks on desktop, usually header height plus 12px |
| `--lgij-sticky-top-mobile` | Where the stage sticks on phones, usually the mobile header height |
| `--lgij-gutter` | Side padding inside the component. Default 0 |

### Page-level settings (set on `<html>`)

| Attribute | Values |
| --- | --- |
| `data-lgij-sound` | `on` or `off` (default off; sounds are made in code and need a tap first) |
| `data-lgij-calm` | `on` or `off`; the visitor's reduced-motion setting also calms everything |
| `data-lgij-palette` | `rainbow`, `unicorn`, `sunshine`, `ocean`, `berry` |

### Events

- In: `window.dispatchEvent(new CustomEvent('lgij:select-unit', { detail: { slug: 'rainbow' } }))` puts that bouncer in the yard (for "Book This One" buttons).
- Out: `lgij:hold-placed` bubbles from the element with `{ date, units, payment }` after a successful hold.

## Config JSON

```json
{
  "phone": "(757) 555-0100",
  "ageRange": "Up to age 7",
  "units": [
    { "slug": "toddler-slide", "name": "Toddler Bounce House with Slide", "short": "Slide house", "hourlyRate": 50 },
    { "slug": "rainbow", "name": "Rainbow Bounce House", "short": "Rainbow", "hourlyRate": 50 },
    { "slug": "unicorn", "name": "Unicorn Bounce House", "short": "Unicorn", "hourlyRate": 35, "ribbon": "Our smaller bouncer" },
    { "slug": "toddler-slide-play", "name": "Toddler Bounce House with Slide & Play Area", "short": "Slide & play", "hourlyRate": 50 }
  ],
  "minimumHours": 2, "maximumHours": 8, "earliestStart": "09:00", "latestEnd": "20:00", "defaultStart": "11:00",
  "minimumNoticeDays": 2, "monthsAhead": 11,
  "bookingFee": 50, "bookingFeeCredited": null, "balanceDueText": null, "taxRate": null,
  "holdMinutes": 30, "serviceArea": null,
  "links": { "policies": "/policies", "privacy": "/privacy-sms-terms" }
}
```

`null` values show a bracketed placeholder until the owner answers. `bookingFeeCredited` is `true` when the $50 counts toward the total and `false` when it is added on top. `taxRate` is a decimal such as `0.06`. `serviceArea` is a list of city names and ZIP codes.

## API contract

All JSON. The component never sees GHL IDs or tokens.

`GET {api-base}/availability?units=rainbow,unicorn&month=2026-11`

```json
{ "open": ["2026-11-01", "2026-11-02"], "earliest": "2026-11-01" }
```

`open` lists dates on which every listed unit is free. Dates before `earliest` show as too soon; other dates not in `open` show as taken.

`POST {api-base}/booking`

```json
{
  "units": ["rainbow", "unicorn"], "date": "2026-11-07", "startTime": "13:00", "endTime": "16:00", "hours": 3,
  "payment": "all",
  "address": { "street": "", "city": "", "zip": "" },
  "contact": { "firstName": "", "lastName": "", "phone": "", "email": "" },
  "party": { "eventType": "", "guestCount": "", "surfaceType": "", "powerOutlet": "", "childName": "", "childBirthday": "", "heardAbout": "" },
  "whoIsThisFor": "Individual or Family",
  "smsConsent": true, "policiesAccepted": true, "website_url": "",
  "quoted": { "rental": 255, "bookingFee": 50 }, "source": "party-builder", "version": "1.0.0"
}
```

`payment` is `all` or `fee`. `website_url` is a honeypot. `quoted` is for logging only; the server always recomputes the price.

| Response | Component shows |
| --- | --- |
| `{ "ok": true, "payUrl": "https://...", "holdExpiresAt": "ISO time" }` | Confetti, the held view, a countdown, and a Pay Now link |
| `{ "ok": false, "reason": "date_taken" }` | Back to the calendar with fresh dates |
| `{ "ok": false, "reason": "already_holding" }` | A note to check texts and email for the payment link |
| `{ "ok": false, "reason": "saved_for_followup" }` | "We saved your party! Alecz will text you shortly." |
| `{ "ok": false, "reason": "invalid", "message": "..." }` | The message |
| Network error or non-JSON | Try again, or text the business number |

`POST {api-base}/request` (organizations, and families outside the service area)

```json
{
  "requestType": "organization", "whoIsThisFor": "Organization",
  "organizationName": "", "firstName": "", "lastName": "", "phone": "", "email": "",
  "eventType": "", "eventDate": "2026-12-05", "eventStartTime": "10:00", "eventEndTime": "13:00", "eventAddress": "",
  "guestCount": "", "surfaceType": "", "powerOutlet": "", "heardAbout": "", "notes": "",
  "inflatables": ["rainbow"], "smsConsent": false, "website_url": "", "source": "party-builder", "version": "1.0.0"
}
```

`requestType` is `organization` or `outside-area` (then `whoIsThisFor` is `Individual or Family`). Respond `{ "ok": true }`.

## Build

```sh
npm install
node build.mjs 1.0.0
```
