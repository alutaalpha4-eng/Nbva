# NBVA School Management: project files

Everything for the school management system: parent portal, teacher, accounts, principal and admin dashboards,
backed by Supabase (database, sign-in, file storage and one admin function).

## What is in this folder
```
website/                 The site you deploy. Static files, no build step.
  index.html, app.js, config.js
supabase/
  migrations/            The database, in the order it was built. Run them in name order on a new project.
  functions/
    admin-users/         Creates staff, resets staff passwords, removes users (admin only). Deploy this.
    notify-absences/     A switched-off stub. SMS alerts are disabled. Deploy it only if you want it to exist.
  bootstrap_admin.sql    Creates the first admin (staff code NBVA-2025). Edit the password, run once.
  one-off/               Only for the original project. Do not run on a new one.
docs/achievement_levels.xlsx   The EE / ME / AE / BE levels and score ranges.
prototype/nbva-school.html     The first demo with sample data and no database. Kept for reference.
```

## Setting up on a NEW Supabase project
1. Run each file in `supabase/migrations/` in name order (SQL editor or `supabase db push`).
2. Deploy both functions in `supabase/functions/` (verify JWT on).
3. Open `supabase/bootstrap_admin.sql`, set a password, and run it once.
4. In `website/config.js` put your project address and public (anon) key.
5. Deploy the `website` folder (steps below), then do the dashboard settings listed below.

The current live project (hayylzszuhwtlwdwlahb) already has all of this applied.
The older "school portal" data in it is kept in the private `legacy_school_portal` area.

## Deploying the website

A static website (no build step) that talks to your Supabase project.
Files: `index.html`, `app.js`, `config.js`.

## Deploy (pick one)
- **Netlify**: go to app.netlify.com/drop and drag this folder onto the page.
- **Vercel**: create a project from this folder (framework: "Other", no build command).
- **GitHub Pages / Cloudflare Pages**: push the folder to a repo and publish it as a static site.

`config.js` already holds your project address and public key. The key is meant to be public.
Access is controlled by the row level security rules in the database, not by hiding the key.

## Do these in the Supabase dashboard (Authentication)
1. **Site URL and Redirect URLs**: set the Site URL to your deployed address, and add the same address under Redirect URLs (URL Configuration). Parents' password-reset emails need this to bring them back to the site.
2. **Confirm email**: decide whether parents must confirm their email before signing in
   (Sign In / Providers, Email). If on, make sure an email sender is set up (SMTP) for real use.
3. **Leaked password protection**: turn it on (Sign In / Providers, Email, Password security).
4. Optional: raise the minimum password length to 8 to match the site.

## First sign-in
- Admin tab: staff code `NBVA-2025` and the starting password you set in `bootstrap_admin.sql`. You will be asked to choose a new password straight away.
- Then, under **Admin > Staff accounts**, add the principal, deputies, accounts staff and teachers.
  Each gets a staff code and a starting password, and chooses their own password at first sign-in.
- Assign each teacher's classes under **Teachers and assignments**.
- Choose each class's **class teacher** under **Class teachers**. They take attendance every morning from their Teacher tab.
- Add students (admission number, UPI, photo, class) under **Students**.
- Parents sign up themselves in the Parent portal, then link a child with the admission number and UPI.
- A parent who forgets their password uses **Forgot your password?** on the sign-in form. They get an email link and choose a new one.

## End of the academic year
Under **Admin > End of year promotion**: choose the new year, tick any students who repeat, review the summary and type PROMOTE.
- Every active student moves up one class and gets that class's subjects (optional subjects still on offer are kept).
- **PP2 children graduate into Grade 1.** After promotion a printable **PP2 graduation list** appears for the ceremony. If the school charges a graduation fee, bill it to PP2 under Accounts before promoting.
- **Grade 9 students complete and leave.** They stay on record, and Accounts can still see them as Alumni to collect unpaid fees.
- The academic year changes and the term goes back to Term 1. Old marks stay stored under the year they were entered in.
- Print the year's results slips **before** promoting, because the site shows the current year only.
- **Undo** works until marks or fees are entered for the new year.

## Notes
- Staff sign in with a staff code. Behind the scenes each code becomes a private login address
  (`code@staff.nbva.invalid`). These addresses never receive email, so staff cannot reset their own password.
  An admin resets it from the Staff accounts table.
- The old "school portal" data is kept in the private `legacy_school_portal` area of the database.
- Fee item amounts are placeholders. Accounts should set the real ones.
