---
title: "Making my first garbage website\r"
date: "2023-01-02"
author: "androo\r"
legacy_id: "1672646400"
---

## React Website Notes
### Preface
Jotting down some random notes here. This isn’t meant to be an educational guide but just notes for me to refer back to for some stuff I thought were noteworthy while building this site. Apologies for it being very syntatically messy; I wanted to document in MD (and the remainder of posts in this site thankfully will be) but I used Google Docs to start off and its MD support is pretty garbage. Still lots to fix up for the site but posting this for now.

I was a bit ambivalent about blogging in the beginning because of posts like this [one I read just today](https://news.ycombinator.com/item?id=34223288) but then I realized no one cares and I hope that I and this blog will remain mostly unseen by the public. I just wanna learn how to build cool websites.

### Starting Tutorial
Ref: https://www.youtube.com/playlist?list=PLASldBPN_pkBfRXOkBOaeCJYzCnISw5-Z 

First of all there’s a difference between npm and npx. The former is the standard node package manager while the other is something installed from npm that is somewhat of a short-hand tool to also execute npm binaries [0].

We’re going to create a `content/` directory in the `$root/src/` directory. This will hold all the MD files that will be the posts for our blog.

Typically we have some kind of database to store the files and they’re read in from the ORM or DB, but it looks like in the video he’s coming up with his own format for storing/querying the Markdown.

To read the data from our `content/` directory, we created a `getposts.js` file in the `$root/public/directory`. Might want to clean this up later by using a DB and adding that component into our app or perhaps just making a `models.js` folder to better clearly define the abstractions.

So this is kind of wacky; we’re invoking a CLI command in the `$root/package.json` under the list of scripts, ours labeled as `“server”`.

```
  "scripts": {
    // …
    "server": "node public/getposts.js"
  },
```

Instead of running with npm start, we run the above with `npm run server`. Not really sure why this is.

### Pondering routing
Trying to understand routing; looks like we have react-router/react-router-dom? to do routing on the frontend, express.js to do routing from the backend, and axios to make HTTP requests from frontend to backend [1]. This is probably out of scope (the backend part) for now, but was curious about this. The definition of routing also seems to be adding mapping “routes” to resources such as pages (think more pages in a URL) for the frontend and elements (routes may lead to different processes/functions) in the backend I think. Will need to dig into this more later.


### Siderant from DTao about webdev stuff
Rants and notes from DTao:
- Look into this for perf! Millionjs [2]
- https://swc.rs/
- Use vercel with next.js, better than netlify - though it has good wrappers around lambda.
- Vercel abstracts it all away (they sponsor million.js)
- yarn is another pkg manager substitutional to npm (node package manager). npm is slower than yarn.
- pnpm is similar to above but supposed to be better optimized. Used more in China apparently due to using symlinks.
- Try and get as little JS to the client as possible.
- Remix and next.js help speed up this stuff.
- Look into edge runtimes, page streaming, progressive web apps, want to get your app feel like a single-page app.
- Deno hard to ever get as good as node. Bun still too nascent.
- JSX gets bundled into react
- Bundler does some stuff with its interpreter
Attributes from JSX are props, it interprets it and feeds it into react framework to render.
This is to stop react element nested calls. See here how JSX transpiler 1:1 to React code and how the JSX is much nicer to read than React. [6]
- Better Asana called linear [7]

These notes are probably incomprehensible since I was just listening and writing things that stuck out to me.


### Trying Gatsby
Trying to install Gatsby.js, failing due to dependency errors
I wanted to try and use Gatsby.js to build the blog site instead since it sounded like that was a popular framework (or tool?) to use, but it seems to be very hard to do.

When I installed gatsby it complained that my node version was too old. I was running node version 17.9.1 while gatsby 5.0+ needed node to be on version 18.0.0+ [8]. 

I also had no idea, but apparently the even numbered node versions lose support (reach EOL) as soon as the next major version comes out while the even numbered ones keep long-term-support (LTS), meaning my version 17.9.1 is no longer supported [9]. 

When trying to upgrade node to either version 18.X or 19.X I kept on getting the error:
`node: /lib/x86_64-linux-gnu/libc.so.6: version 'GLIBC_2.28' not found (required by node)`

Apparently GLIBC only has version 2.27 for Ubuntu 18.04, this is some other thread I see where others complain of an application with a GLIC == 2.28 dependency breaking on Ubuntu 18.04 LTS [10].

The options from here were to try and upgrade GLIBC to 2.28+ or upgrade Ubuntu 18.04 -> 20.04 or 22.04, noting that I’m not an actual Linux machine but am instead using WSL. Apparently the latter is quite a bit of work [11], but the former runs the risk of breaking your OS [12].

For now maybe I’ll just stick to building without Gatsby, this way at least I’ll learn a bit of react-router and then just upgrade my version of WSL Ubuntu later.

TODO:
Upgrade Ubuntu WSL
Get off non-LTS node versions
Back to tutorial, looking at routing
Installing the packages:
react-router-dom 
React-markdown: markdown parser for react

Apparently these have a security vulnerability or something and I ran npm audit as it told me to, but then ran into some more GLIBC problems again so now I’m really hoping to upgrade WSL later.

### Going back to tutorial, adding static Routing
So trying to add routing actually was harder than I thought. I’m not sure how in the world the guy in the video had it working – I did exactly what he did and it didn’t work. I’m wondering/hoping the reason was simply because we had different versions of react-dom-router or something since the video is 3 years old.

Instead I asked ChatGPT what to do and it recommended I put the routing in a separate routes.js file, have that file present in the App component, and just have the App component rendered by the ReactDOM in the top-level index.js as it was before. Not sure if this is the right way to do things but it’s working for me for now. 

ChatGPT response attached in the appendix below.

Okay I’m just going to do routing from App() in App.js. I tried splitting up the routing but wasted an hour because for the life of me I couldn’t get it to work. The routing works from App.js but when I separate it into its own JS file and import it it doesn’t work and I couldn’t figure out why so screw it.

I was able to add the headers and footers just fine as described in the video. What’s interesting is that he had them encapsulated in a layout component and had the App simply render the Layout. I wonder if this is best practice? Each page will likely be composed of several other components, so should we have a Layout top-level component for each page perhaps?

Also added some CSS flex stuff to the layout to push the footer to the bottom of the page and have proper spacing for the blogposts. Will be good to look back at these later for reference.

Another interesting note on CSS, so our file structure for pages currently looks like:

```
├── components/
│   ├── components.css
│   ├── footer.js
│   ├── header.js
│   └── layout.js
```

We use `<Header />` and `<Footer />` components in `layout.js`. All of them have CSS styling in components.css, and we import the CSS in only `layout.js` (the most top-level module in this directory). Importing CSS in footer and header is redundant, and omitting the CSS import from `layout.js` and adding individually in `footer.js` or `header.js` doesn’t work.

Also some random trivia for myself: we do need to commit the `package*.json` files since they track dependencies [13]. TLDR, package.json has a 100ft view of the dependency tree and has minimum required versions for packages to install. `package-lock.json` is more like a 10ft view or is at least more granular or something. Doing an npm install in a directory looks for the `package*.json` files to find what packages to install.

So to review and summarize, this is our current dependency tree (for important files I’ve interacted with):

```
├── public/
│   ├── main.js
├── src/
│   ├── components/
│       ├── components.css
│       ├── footer.js
│       ├── header.js
│       └── layout.js
│   ├── pages/
│       ├── pages.css
│       └── home.js
│   ├── posts/
│       ├── firstpost.md
│       └── secondpost.md
│   ├── App.js
├── App.js
└── index.js
```

- Index.js is the top-most level where the ReactDOM renders the root component.
- App.js is the root component and doesn’t render anything really (though it can and probably should). At the moment it does the routing to other pages.
- The only route we have thus far is to the home page defined in src/pages/home.js.
The Home component simply uses the Layout component and the meat of its contents (still WIP) I’m guessing will be showing the posts. 
- The posts are retrieved via a special getPosts() method defined in public/main.js. 
- The posts read in by getPosts() write them in JSON format as posts.json in our src/ folder.
- The actual posts themselves are stored in src/posts/ in Markdown.
- The Layout component is defined in our src/components/ folder and is made up of two more components: header and footer which are also contained in this component folder.

Also some interesting disambiguation between Element and Component since in my head I was using them interchangeably [14].

Font is still broken. We’re using a Google font called Railway which seems nice. Shouldn’t be too hard to fix, I think I just need to download it and add to project somehow. I was going to do it but when I looked at how to do this the stack overflow article wouldn’t load because it said stack exchange was doing maintenance. Think my network is just being dumb.

Also added a YouTube embed to a post which was kinda interesting. Didn’t realize I had to change the URL to have ‘embed’ in there instead of ‘watch’ [16].

There were also a lot of problems using the ReactMarkdown package he used. They revamped their API so the current version I was on had none of the props he used. The library API docs are here [17], and also had to download an extra plugin to render the HTML properly [18] [19].

### Dynamic Routing
The tutorial was quite old and so the APIs for doing dynamic routing weren’t relevant anymore. Luckily was able to find a post of how to do dynamic routing and getting props in via React Hooks instead [20].

Another change in redirecting is that `Redirect` Seems to have been deprecated from react-router-dom. Instead we use `Navigate` as suggested by this article [21].

Alright so I actually kinda went ahead and finished but went to sleep before documenting because it was like almost 6 AM. Gonna try and document current state of things and how I got there.

So looking at the file tree again:
```
├── public/
│   ├── main.js
│   └── CNAME
├── src/
│   ├── components/
│       ├── components.css
│       ├── footer.js
│       ├── header.js
│       ├── postlist.js
│       ├── navbar.js
│       └── layout.js
│   ├── pages/
│       ├── content/
│           ├── about.md
│       ├── pages.css
│       ├── about.js
│       ├── notfound.js
│       ├── post.js
│       └── home.js
│   ├── posts/
│       ├── firstpost.md
│       └── secondpost.md
├── pages.json
├── posts.json
├── App.js
└── index.js
```

The file list has grown quite a bit but will try and summarize what’s going on here.

- `public/` has main.js which has the helper functions to read MD files and output them in json. 
  - All the MD posts from `src/posts/` are saved into posts.json and MD files in `src/pages/content/` are saved into pages.json.
`CNAME` is a DNS record file for letting me redirect the domain from a github.io site to my own site.
- `src/components/` has the React components and the styling CSS file.
  - Each one is fairly straightforward and follows the same pattern of having React imported, creating a function to return some JSX, and exporting the function
  - The components may be used by each other; `layouts.js` uses `header.js` and `footer.js` for example.
  - The `navbar.js` component uses Links from react-router-dom to create a navbar and have links.
  - `postlist.js` reads from posts.json and renders the posts in a list for us to show while also truncating some of it.
- `src/pages` contains the pages (each page has its own JS file) and CSS, and the components are used here.
- `App.js` handles all the routing.
`Index.js` just renders the App component.

### Deploying to Github Pages
The method of deploying was fairly straightforward: 

Got help forwarding the domain to a Google domains site here though [23]. Basically just had to configure an A record with the GH IPs [24] and a CNAME record for the www subdomain to point to my new site. The custom domain name had to be added in the package.json as:

```
  "homepage": "https://androochen.com",
```

Along with some other GH page scripts. The deployment process is fairly simple. To add and read more MD posts we can just run the main.js in the public file to convert them to JSON with `npm run server`.

Then deploying the website will simply be `npm run deploy`

[0] https://www.npmjs.com/package/npx 

[1] https://appdividend.com/2022/03/12/react-axios/ 

[2] https://millionjs.org/ 

[3] https://swc.rs/ 

[4] https://vercel.com/

[5] next.js

[6] https://babeljs.io/repl/#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=false&corejs=3.21&spec=false&loose=false&code_lz=GYVwdgxgLglg9mABACwKYBt1wBQEpEDeAUIogE6pQhlIA8AJjAG4B8AEhlogO5xnr0AhLQD0jVgG4iAXyJA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=react&prettier=false&targets=&version=7.18.9&externalPlugins=&assumptions=%7B%7D 

[7] https://linear.app/ 

[8] https://www.gatsbyjs.com/docs/reference/release-notes/migrating-from-v4-to-v5/#minimal-nodejs-version-1800 

[9] https://nodesource.com/blog/understanding-how-node-js-release-lines-work/ 

[10] https://github.com/pi-hole/FTL/issues/1420 

[11] https://askubuntu.com/questions/1428423/upgrade-ubuntu-in-wsl2-from-20-04-to-22-04 

[12] https://stackoverflow.com/questions/72513993/how-to-install-glibc-2-29-or-higher-in-ubuntu-18-04 

[13] https://dev.to/salothom/package-json-vs-package-lock-json-do-you-need-both-1mjf 

[14] https://www.geeksforgeeks.org/what-is-the-difference-between-element-and-component/ 

[15] https://fonts.google.com/specimen/Raleway 

[16] https://stackoverflow.com/questions/25661182/embed-youtube-video-refused-to-display-in-a-frame-because-it-set-x-frame-opti 

[17] https://github.com/remarkjs/react-markdown#use 

[18] https://github.com/remarkjs/react-markdown#appendix-a-html-in-markdown 

[19] https://github.com/rehypejs/rehype-raw 

[20] https://blog.webdevsimplified.com/2022-07/react-router/#Dynamic_Routing:~:text=useRoutes%20Hook-,Dynamic%20Routing,-The%20simplest%20and 

[21] https://bobbyhadz.com/blog/react-export-redirect-was-not-found-in-react-router-dom 

[23] https://www.youtube.com/watch?v=M5ZtKvk3Sag 

[24] https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain

Appendix
ChatGPT response:
It is common to define routing in a separate file from the root component of your app, and then import the routing information into the root component. This helps to keep the code for your routes separate from the rest of your app, which can make it easier to manage and maintain.

With this approach, you would typically define your routes in a file such as routes.js, and then import them into your root component (e.g. App.js) to make them available to the rest of the app.

For example, you might have the following code in your routes.js file:

```
import {
  BrowserRouter as Router,
  Route,
  Link
} from "react-router-dom";

function AppRoutes() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/users">Users</Link>
            </li>
          </ul>
        </nav>

        <Route path="/" exact component={Home} />
        <Route path="/about" component={About} />
        <Route path="/users" component={Users} />
      </div>
    </Router>
  );
}

export default AppRoutes;
```


And then in your App.js file, you would import the AppRoutes component and render it as part of your root component:

```
import React from 'react';
import AppRoutes from './routes';

function App() {
  return (
    <div>
      <AppRoutes />
    </div>
  );
}

export default App;
```

Finally, in your index.js file, you would import the App component and render it to the DOM:

```
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```

This is just one way that you can structure your React app with routing. There are many other approaches that you can take as well. The important thing is to choose an approach that works well for your particular app and that makes it easy to manage and maintain your code.

