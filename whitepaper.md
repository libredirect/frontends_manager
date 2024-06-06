# Whitepaper

## History
After forking from Privacy Redirect, we started adding features. Those features were mainly about managing multiple instances. Mainly:
- Unify Settings: A feature which copies cookies (theme, subscriptions, etc...) from one instance to another. Then we went further and added support to Incognito mode. Then we went more further and added support for the Tor Browser (recreating cookies upon restart because Tor Browser deletes them all).
- Auto Skip offline instances: A feature which detects a 500 server error or a hostname error, and automatically switches to the next instance in the list.

On a fresh install, you would have **all** instances selected. Then we made it as **none** is selected at first, but then a user asked me "How will I know which instance to select or trust even?". Apparently we have two types of people:
- A type where he selects all instances and doesn't care much.
- A type where he only uses instances he trust, or he may host them on his own.

## Flaws with using an instance
- The instance knows my IP address.
- You can't trust if the instance owner is not logging what videos you're watching from your IP: this doesn't need any tracking scripts.

Let's say you will use the Tor Browser or a VPN to spoof your IP, but...
- How can I trust a random instance not changing the JS of the UI?: Technically possible, and also easily detected by a nerd.
- Custom Appearance Settings: This can be through cookies or URL Parameters or an account: wanting a dark theme, default speed to be 1.25, volume to be %75 is fingerprinting. Having an account is yet another level of fingerprinting. So even if you used Tor, you will be fingerprinted. This is natural though, you are not a robot, you want to have a specific volume, a specific theme, a specific speed, etc...

Also:
- Instances just die every now and then. You're forced to migrate to another instance with all your settings every now and then.

## Flaws with using multiple instances
- How will you manage your custom settings across all of them? Unify Settings? the worst idea we've implemented technically, let alone trying to Unify accounts.

Unify will also fingerprint you across multiple instances.

## Frontends Manager
Frontends Manager separates the UI from the instances, it hosts frontends locally. So, all your custom settings are now saved locally. one problem solved.

Now to the other tricky problem, your IP, there are multiple solutions, either Frontends Manager implements a way to connect through Tor, or you use Lokinet with an exit node, or use a VPN, or (concept) make instances as restricted VPNs.

## Restricted VPNs
This is still in the works, but it makes the instance act as a VPN that accepts routing traffic to ONLY youtube.com, twitter.com, tiktok.com, etc... This way they won't be abused as "Free VPNs". It's a middle solution between using the really slow Tor or Lokinet, and between connecting directly to youtube.com, twitter.com, tiktok.com and exposing your IP. Having instances as VPNs will also make your traffic go through them encrypted. Now you don't have to trust those instances anymore.
