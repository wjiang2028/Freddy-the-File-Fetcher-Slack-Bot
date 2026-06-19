# Freddy-the-File-Fetcher-Slack-Bot

Freddy is a Slack bot that finds files scattered across your channels and direct
messages — by type and by who sent them — and delivers them wherever you need them.
Looking for every PDF in #general, or all the spreadsheets your manager posted?
Just ask Freddy.

# Add Freddy to your workspace


Open the install link: https://wenxijelly.hackclub.app/slack/install
Click Add to Slack, choose your workspace, and click Allow.
Invite Freddy to any channel you want it to search or post in:


   /invite @Freddy

Freddy can only see and send files in channels it has been invited to.

That's it — Freddy is ready to use.

Using Freddy

# The command format is:

/freddy location file-type (from @person/#channel) (to destination)

Parts in parentheses are optional. If you don't give a to destination, Freddy
replies privately to just you.


Tip: type /freddy-help in Slack any time to see this reference.



Location — where to look


#channelname — a specific channel
all — everywhere Freddy can see
here — the channel or group you're currently typing in


File type — what to fetch


pdf — .pdf
word — .docx, .doc
excel — .xlsx, .xls, .xlsm, .csv
ppt (or powerpoint) — .pptx, .ppt
image — .png, .jpg, .jpeg, .gif, .bmp, .tiff, .webp, .heic, .svg
all — every type


from… — narrow the results (optional)


from @person — only files that person uploaded
from #channelname — only files from that channel (Freddy must be invited there)
from here — only files from the channel/group you're in


to… — where to send the results (optional)


to #channelname — post the files in that channel
to here — post them in the channel/group you're in
(leave it out) — Freddy sends the files privately to you


Make sure Freddy is invited (/invite @Freddy) to any channel you want it to post in.

# Examples


/freddy #general pdf — all PDFs in #general, sent privately to you
/freddy #general all from @Boss — everything Boss posted in #general, privately
/freddy all image to here — every image Freddy can see, posted in the current channel
/freddy #general excel to #HR — spreadsheets from #general, posted in #HR
/freddy #general word from @Boss to #HR — Word docs Boss posted in #general, sent to #HR
/freddy all all to here — every file Freddy can see, posted in the current channel


# Good to know


Freddy only sees files in channels it's a member of — invite it with /invite @Freddy.
Leave off the to part and your results stay private to you.
Need the cheat sheet in Slack? Run /freddy-help.


# Built with

Node.js and Slack Bolt, using Slack's OAuth
flow so any workspace can install it. Runs as an always-on service.
