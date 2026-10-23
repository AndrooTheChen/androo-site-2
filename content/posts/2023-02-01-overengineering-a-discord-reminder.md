---
title: "Overengineering a Discord Reminder"
date: "2023-02-01"
author: "androo"
legacy_id: "1675238400"
---


## Context
We created a Discord server for the YF kids to use as a discussion and reminder group to read along for the book
"A Purpose Driven Life" by Pastor Rick Warren. Each chapter had a title, verse to remember, point to ponder, and 
question. I thought it would b neat to have these all included in the daily notification. Instead of spending an
hour to put these all in a spreadsheet to read from and automatically notify using the Integromet/Make bot
from Discord, I thought it would be fun to waste ~3 hours to automate the spreadsheet population.

The data was posted on the official website for the book (albiet each chapter had its own page route) [3] and scraped
 using BeautifulSoup [4].

## Workflow automation
Setting up the workflow for going from Google Sheets -> Http API server -> Discord bot was fairly straightforard.
Used the references [0][1] and took a couple minutes to setup. It was somewhat straightforward. The tutorials were
okay. It was weird how clicking on components (specifically the Spreadsheet API component) sometimes let me 
configure it but not configure where on the spreadsheet to start. I would have to right-click on it but it was't 
very consistent.

## Scraping
Used the official Purpose Driven Life website to scrape the "point to ponder", "verse to remember", and "question".
What was awkward was the chapter titles weren't from this site directly so I couldn't scrape from there. Instead
I just copy/pasted the table of contents in the pages from the PDF we were given and did some jank multi-line editing
magics with vim.

Interesting, I was getting a bunch of Forbidden 403 responses when trying to scrape. Apparently the workaround
is fairly simple: disguise the request as if it was being sent from a standard Mozilla browser. https://medium.com/@raiyanquaium/how-to-web-scrape-using-beautiful-soup-in-python-without-running-into-http-error-403-554875e5abed

There is also a few parsers out there for parsing the HTML, this answer gives a good overview of the differences https://stackoverflow.com/a/45494776

## Sheeting
Used the Google Sheets API to dump values into a spreadsheet. The only gotcha was setting up auth. Just used the setup code from the initial "get" example that reads a credentials.json which generated a token.json. Auth is always
boring/annoying imo.

Overall this was a pretty fun project. I thought about creating a full Discord bot for this, but I'm lazy. And I 
wanted to use Inteogrmet/Make bot instead of hosting it myself because I actually created this while on a business
trip so I didn't have any computers/RPIs on hand.


[0] https://www.make.com/en/help/app/discord#connect-to-discord-using-oauth2-and-your-own-credentials

[1] https://www.integromat.com/en/help/how-to-send-a-message-to-a-discord-channel-via-http-when-a-google-sheet-is-updated

[3] https://www.purposedriven.com/day1

[4] https://www.crummy.com/software/BeautifulSoup/bs4/doc/
