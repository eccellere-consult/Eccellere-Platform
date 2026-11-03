# Connecting Google Drive to the Eccellere Advisor: step by step

**What this does:** you create a "robot" Google login that can only *read* the folders you share with it. The Advisor reads those folders, removes names and contact details, holds each document for your approval, and only then uses it to answer clients. Nothing is copied back to Drive and clients are never given a Drive link.

Time: about 20 minutes, once. You need a Google account that can use Google Cloud (a free account is enough).

## Part A: create the robot login (Google Cloud)

1. Open https://console.cloud.google.com and sign in.
2. At the top, click the project box, then **New project**. Name it `Eccellere Advisor`. Click **Create** and make sure it is selected.
3. Menu (three lines, top left) → **APIs & Services** → **Library**. Search for **Google Drive API**. Click it, then **Enable**.
4. Menu → **IAM & Admin** → **Service Accounts** → **Create service account**. Name: `eccellere-advisor`. Click **Create and continue**, skip the two optional steps, click **Done**.
5. Click the new account in the list → tab **Keys** → **Add key** → **Create new key** → **JSON** → **Create**. A file downloads. **Treat it like a password.** Do not e-mail it or put it in a shared folder.
6. On the account's **Details** tab, copy its **e-mail address** (it looks like `eccellere-advisor@eccellere-advisor.iam.gserviceaccount.com`).

## Part B: share the folders (Google Drive)

7. In Drive, right-click the folder you want the Advisor to use → **Share**. Paste the robot's e-mail address, choose **Viewer**, untick "Notify", click **Share**. Repeat for each folder. Sub-folders are included automatically.
8. Share only material that is safe to learn from. Anything in these folders may shape answers to clients (after anonymising and your approval).

## Part C: give the key to the website (Hostinger)

9. Open the downloaded JSON file in Notepad. Select everything and copy it.
10. In Hostinger, open the website's **Environment variables**. Add a new one:
    - Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
    - Value: paste the whole file contents as one value.
11. Save, then click **Redeploy**.
12. In phpMyAdmin, run the file **advisor_tables.sql** (SQL tab → paste → Go). It is safe to run twice.

## Part D: use it (Admin → Eccellere Advisor)

13. Add your **protected names** first: every client company, person and brand that appears in your documents, one per line. Click **Save names**.
14. Under **Google Drive library**, paste the folder links (one per line) and click **Save folders**. The page should say it is connected as the robot's e-mail.
15. Click **Sync now**. It reads up to 12 files per click; click again until it says nothing is left.
16. Under **Documents**, every file starts as **Waiting for your approval**. Click **Preview** to see exactly what the Advisor would learn (names already removed). If any name remains, add it to the protected names, sync again, and re-check. Click **Approve** only when you are satisfied.
17. Ask the Advisor a question from your own documents and check that the answer cites "Eccellere knowledge" and contains no names.

## Keeping it safe

- **Leave "publish automatically" off** until you have approved a good number of documents and found nothing slipping through. The checks recognise e-mails, phone numbers, outside links, companies written with "Pvt Ltd / Inc / LLP" and so on, people named after "Prepared by / Dear Mr" and your protected list. They cannot recognise a name nobody has told them about, so your approval is the real safeguard.
- **Remove access any time:** un-share the folder in Drive or delete the file. The next sync deletes the Advisor's copy and it can no longer be used.
- **Switch the Advisor off** on the same Admin page if anything looks wrong.

## What it reads today

Google Docs, Sheets, Slides, Word, Excel, PowerPoint, text, Markdown and CSV, up to 15 MB each. PDFs and scanned images are listed as "cannot be read yet" and are on the roadmap.
