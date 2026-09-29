# App navigation flows

## Unregistered unknown users

Landing page is '/about'.  This serves as a marketing page selling the utility of the app.  This page also shows the PWA install/upgrade prompts if needed.  A "More Info" link will load another page for 1) displaying more device-specific instructions as needed and 2) at a minimum, describing more PWA instruction for users unfamiliar with PWAs.  The "More Info" page could do double duty as a PWA install page, again with the detailed instructions for specific devices as needed.

> /about -> /install

## Registered or previously seen users

The "Home" page is the 'user's' home page.  This is the page that doesn't sell the user on the app but allows the user to authenticate.  Messaging is differnt here because we already know the user.  Like a typical login screen, it is a combo login/signup component. Special care is needed around the wording because we are going to assume users who are recognized (via cookie) have seen the /about page already.  There may be a backref to /about in the case where a user want to know more "about us".

> /home -> [authenticate] -> /roster

## Main location-aware app

An authenticated user drops to the "roster" page.  It's the lineup of who's "up to bat", i.e. looking to connect.  The page will be hot swappable between a map view and a list view.

> /about -> /install -> /home -> [authenticate] -> /roster

> /about -> /home -> [authenticate] -> /roster

> /home -> [authenticate] -> /roster

> /home -> /about