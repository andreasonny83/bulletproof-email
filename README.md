# Email Template Generator

> An HTML email template builder powered by Gulp.

The main features are:

*   A basic front-end templating system with layouts and sass support
*   Modular sections for different email layouts
*   SASS stylesheets
*   CSS inliner
*   Gulp build tool and BrowserSync for live reloading
*   Send test emails via [Nodemailer](https://github.com/andris9/nodemailer)
*   Gulp tasks for an efficient workflow

## Table of Contents

* [Prerequisites](#prerequisites)
* [Getting started](#getting-started)
* [Usage](#usage)
* [Working with files](#working-with-files)
* [Local server](#local-server)
* [Test Emails](#test-emails)
* [Contributing](#contributing)

## Prerequisites

### Install npm and NodeJS

You can download NodeJS from [nodejs.org](https://nodejs.org/)

## Getting started

### Install all the project's dependencies

```shell
$ npm install
# Or using Yarn
$ yarn install
```

## Usage

`npm run serve layoutName` - starts a local webserver on **http://localhost:8080**

`npm run serve layoutName -- --port=8888` - starts a local webserver on **http://localhost:8888**

`npm run serve layoutName -- --open` - opens the URL on your default browser automatically.

`npm run build layoutName` - builds production ready files in *dist/production* folder.

`npm run build:minify layoutName` - minifies your HTML files

`npm run build:zip layoutName` - builds files + creates a zip file of your images directory (for Campaign Monitor)

`npm run mail` - fires a test email using your default configuration in `nodemailer.config.js` (Please, refer to the [Test Emails](#test-emails) section
for more information)

`npm run mail -- --to=email@example.com --subject='Lorem Ipsum'` - send a test email with overrides

Continue reading below for more details

## Working with files

All files are under the *src* folder organised into separate layouts directories.
To start working on a new email template, just create a new folder under `src/layouts` or just clone
the `example` folder provided with this repository.

*   **layouts** - layout templates
*   **layouts/styles** - it's important that all the styles for the templates sit under a styles folder inside your template.

Also, in your template html file, the reference to the styles will always be

```html
<!-- inject:css --><!-- endinject -->
```

like in the example provided.

## Local server

```sh
$ npm run serve layoutName
````

where `layoutName` is the name of the folder you want to serve
(eg. `npm run serve example`) to start a local webserver.
Visit **http://localhost:8080** on your browser to test your templates.

You can also run:

```sh
$ npm run serve example -- --open
```

to open the URL automatically on your default browser.

This also instantiates a watcher that:

* watches for file-changes in the source folder
* compiles SASS to CSS on-the-fly
* builds the HTML files from the templates
* outputs latest files to *dist/local* folder
* uses Browsersync to reload the browser

You can also choose a different port by passing the `--port` argument, e.g. `gulp serve --port=8888`.  You can also change the port permanently in `gulp.config.js`.

## Production files

```sh
$ npm run build layoutName
```

This will compile a production-ready HTML to the *dist/production* folder.
It does the following operations:

* compiles SASS to CSS
* builds the HTML files from the templates
* brings the CSS inline into the HTML and removes the CSS files (except `media-queries.css`)
* minifies the images (only those that have changed)

## Minify

```sh
$ npm run build:minify layoutName
```

If your newsletters are very long, you should minify the HTML so that Gmail doesn't [clip them](https://www.campaignmonitor.com/forums/topic/8088/what-rule-does-gmail-use-to-decide-when-to-clip-a-message/).

## Zip files

```sh
$ npm run build:zip layoutName
```

Some email tools require zip files to upload new templates.

## Test Emails

```sh
$ npm run mail
```

This task will send a test email using Nodemailer.
To know how to configure this project to use your Nodemailer configutration,
please continue reading the following sections.

All configuration options are in the `gulp.config.js` file.
To send emails using Nodemailer, update `nodemailer.config.js` with your email credentials and other mail options.

### Nodemailer

[Nodemailer](https://github.com/andris9/nodemailer) lets you quickly test your html email templates.

First update `nodemailer.config.js` with your `mailOptions`

```js
mailOptions: {
  to: 'default@test.email.com', // Default address(es) to send test emails to (can be comma separated)
  from: 'Email Template Generator <email@template.generator.org>', // Sender details
  subject: 'Test email - sent by Email-Template-Generator' // Default subject line
},
imageHost: '' // Full url path to your image host, with a trailing slash.
```

### Mailgun

If you don't have yet a mailgun account. Register your free one [here](https://app.mailgun.com/new/signup/)

After you have validated your credentials, reach your mailgun dashboard and create
a [new domain](https://app.mailgun.com/app/domains) if you don't have one already on your list.

Then, you need to authorized your recipients in order to receive the test emails.
So, click the [Authorized recipients](https://app.mailgun.com/app/account/authorized) button and add your
email address you want to use for testing the email templates.

After you're done with that, update your local `nodemailer.config.js` with your `mailgun` credentials

```js
transportOptions: {
  service: 'mailgun',
  auth: {
    user: 'postmaster@sandboxxxxxxx.mailgun.org',
    pass: 'xxxxxx',
    api_key: 'key-xxxxxx',
    domain: 'sandboxxxxxxx.mailgun.org'
  }
},
```

### How to fill the Mailgun auth key properly

If you're not sure how to update your configuration file properly try following these easy steps:

1.  Log in your [Mail gun dashbard](https://app.mailgun.com/app/dashbard) and navigates into the [Domanis section](https://app.mailgun.com/app/domains)

1.  Make sure you have a domain in the list and that is Active. If not, you'll need to activate that first.
    ![](http://i.imgur.com/VZ5so0g.jpg)

1.  Now click on your domain to disaply the domain information required by Nodemailer.
    ![](http://i.imgur.com/oP7J5MZ.jpg)

1.  Now fill your configuration file with the following informations.


```
user: Default SMTP Login
pass: Default Password
api_key: API Base URL
domain: This is the full domain name. In our example it is: `sandbox189c721ac152422d94141484e7c2ccfa.mailgun.org`
```

Good! Now, you need to validate every single receipient if have included under the mailOptions.to key.
For doing that, there is a `Manage Authorized Recipients` button in the same page.
Click that and follow the instructions on screen.

Now you should be able to send and receive emails. If not, try to read this guide again or check the Mailgun
support page.

Nodemailer supports a lot of services -
see the full list [here](https://github.com/andris9/nodemailer-wellknown#supported-services).
To use your own SMTP configuration, see instructions [here](https://github.com/andris9/nodemailer-smtp-transport#usage).

**Mail Options**

```js
mailOptions: {
  to: '',
  from: '',
  subject: ''
}
```

Set default `to`, `from` and `subject` values. `to` and `subject` can be overridden by passing arguments to the task.

Finally, update `imageHost` with the full Url of the directory where your images are uploaded.
The mail task replaces the relative paths with this Url.

```sh
$ npm run mail -- --to=email@example.com --subject='Lorem Ipsum'
```

## Contributing

To contribute, please fork the project and submit pull requests against the `master` branch.
