# CarWash Connect

Responsive React app for discovering car-wash stations, booking a service slot, viewing invoices, and tracking wash updates. It runs on the web and can be packaged for iOS and Android with Capacitor.

## Firebase and Firestore setup

1. Create a Firebase project, register a Web app, and create its Cloud Firestore database.
2. In Firebase Authentication, enable **Anonymous** sign-in.
3. Copy `.env.example` to `.env.local` and replace each placeholder with the Firebase Web app configuration. These Firebase client settings identify the project; never put service-account keys or other Admin SDK credentials in a `VITE_` variable.
4. Install the Firebase CLI if needed, authenticate, select the project, and deploy the database rules:

   ```sh
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules,firestore:indexes
   ```

5. Start with `npm run start`. On first authenticated launch, the app creates the three built-in station documents if they do not already exist. Firestore collections used by the app:

   | Collection | Purpose |
   | --- | --- |
   | `stations/{stationId}` | Published station details, prices in cents, services, and availability |
   | `bookings/{bookingId}` | Customer, vehicle, reserved date/time, station, status, and wash stage |
   | `invoices/{bookingId}` | Itemized service/tax/total in cents and payment status |
   | `bookings/{bookingId}/updates/{updateId}` | Customer-visible technician updates and optional bay photo URLs |

Bookings and their unpaid invoices are written atomically. Customers can only read their own bookings, invoices, and updates. Built-in stations can only be created with their fixed seed data; managing other stations and posting service updates requires the `admin: true` Firebase Authentication custom claim. The Station Admin switch in the UI is not an authorization mechanism. Assign custom claims only from a trusted server using the Firebase Admin SDK.

Anonymous accounts are local to the browser or app installation; they do not let a customer carry bookings across devices. Add account linking or a sign-in provider before production if cross-device access is needed.

The Pay button currently reports that payment is unavailable and leaves the invoice unpaid. No payment is processed or recorded as paid; integrate a payment provider through a trusted backend before enabling real payments.

If Firebase is not configured, the app displays a demo preview and blocks booking writes rather than implying that demo data has been saved. Firebase configuration is compiled into web/native builds, so set the environment values before building.

## Web, iOS, and Android

The web app is also a Progressive Web App: deploy the `dist` directory to an HTTPS host. On iOS, use Safari's **Share → Add to Home Screen**; on Android and desktop browsers, use the browser's **Install app** action.

To build native apps, install Xcode for iOS (macOS only) and Android Studio with the Android SDK, then run:

```sh
npm install
npm run cap:sync
npm run cap:ios      # macOS only
npm run cap:android
```

Set Firebase environment variables before `npm run cap:sync`; the generated native apps embed the same Firebase-connected web build. Generate or refresh app icons with `npm run assets:generate`.

The wash-foam update photo (`public/car-wash-foam.jpg`) is by 3268zauber and is licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
