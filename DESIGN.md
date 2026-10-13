# Publishing workspace

Subject: Influencers World, a platform for books, conversations, and practical ideas. Audience: the people maintaining its content. The dashboard's job is to make every record easy to find, write, view, and update.

The supplied `../frontend-design.skill` guides this design. Existing site typography and its amber accent connect the workspace to the public brand.

Tokens: paper `#F4F6F8`, white `#FFFFFF`, ink `#172D43`, slate `#203D58`, amber `#F4B740`, rule `#E1E7ED`. Syne supplies restrained display headings, Plus Jakarta Sans supplies body copy and compact data labels. Slate anchors persistent navigation; amber identifies the primary action.

The signature is a publishing desk with a book-spine brand mark and a single slate library band, rather than a row of generic analytics cards. It reflects the site's collection of ideas while keeping tables and editing quiet.

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
