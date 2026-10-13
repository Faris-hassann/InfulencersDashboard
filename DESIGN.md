# Publishing workspace

Subject: Influencers World, a platform for books, conversations, and practical ideas. Audience: the people maintaining its content. The dashboard's job is to make every record easy to find, write, view, and update.

The supplied `../frontend-design.skill` guides this design. Existing site typography and its amber accent connect the workspace to the public brand.

Tokens: mist `#F7F7F8`, white `#FFFFFF`, ink `#111827`, amber `#F59E0B`, amber wash `#FFF5DF`, rule `#E5E7EB`. Syne supplies distinctive display headings; Plus Jakarta Sans supplies body copy and compact data labels. These match the public website. White navigation and quiet mist work surfaces keep amber reserved for meaningful actions and active states.

The revised signature is the public brand's amber button with an ink border and offset shadow. The actual existing logo appears on login and navigation, the crest marks the overview, and the footer logo identifies the publishing workspace. The login's ink panel provides a single strong brand moment; CMS tables and forms remain restrained. The overview includes live content/message counts and latest records rather than invented activity or chart data.

```text
Sidebar       Workspace / Collection
              Collection title             Create item
              Search                       Record count
              ID | Title | Media | Date | View Edit Delete
              Pagination

Editor        Title and rich description   Publication date
              Image and video URLs         Save / Save changed fields
```

Critique before implementation: decorative collection numbers would imply an ordering that does not exist, so use meaningful category icons. Avoid fabricated statistics, sample production records, and unnecessary charts. On small screens, collapse navigation and stack form panels while retaining horizontal table scrolling. Use reduced motion, visible focus indicators, a skip link, descriptive action labels, and native confirmation dialogs.

The redesign replaces the generic blue workspace and synthetic `iw` mark with the source website's real assets and amber/ink identity. Navigation separates publishing from contact messages. Each collection has distinct manage/create actions. The authentication boundary is reflected in a visible administrator identity and an accessible sign-out control; it is enforced by the server and the API.
