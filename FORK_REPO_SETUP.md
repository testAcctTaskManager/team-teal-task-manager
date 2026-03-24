# Instructions on Forking This Repo and Setting Up Infrastructure

1. On the main GitHub page for this repo, click on the Fork button, update the repository name and description as desired, and then click Create fork

2. In the newly created repository, click on Actions, and click "I understand my workflows, go ahead and enable them"

3. Create a Cloudflare account if you do not already have one (https://dash.cloudflare.com/sign-up)

4. In the Cloudflare dashboard, on the left hand slide, scroll down and click on Manage account, click Account API tokens, and then click Create Token

5. Under Custom token, next to Create Custom Token, click Get Started

6. Under token name, use `d1-edit-access-test`, and then under Permissions, in the first drop down menu, search for and select D1, and then in the right most drop down menu, select Edit

7. Click Add more, then in the first drop down menu of the second permissions, search for and select Cloudflare Pages, and then choose Edit in the next drop down menu

8. Click Continue to summary, and then Create Token, saving the token value shown on the screen to a local text file

9. Click View All API Tokens, then click Create Token, repeating the previous Create Token steps but using `d1-edit-access-prod` as the token name, making sure to save this token value to a local text file as well

10. In the left hand side menu, click on Storage & databases, and then click on D1 SQL database

11. Click Create Database, enter `test-db` for the Name, and then click Create

12. Click on D1 SQL database again (under Storage & databases), then click Create Database, enter `prod-db` for the Name, and then click Create

13. Click on D1 SQL database again to go back to the previous page, copy the UUID for `prod-db` and the UUID for `test-db`, and save them to a local text file temporarily, as you will use them in the next step

14. Clone your forked repo and open in your local IDE, such as Visual Studio Code, following this guide if you are unfamiliar with the process: https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository

15. In your IDE, create a new branch, and edit the `task-manager/wrangler.jsonc` file, update the `database_id` value for the `test-db` with the UUID for `test-db` you copied earlier:

```
"database-name": "test-db",
"database_id": "<paste your test-db uuid here>",
```

16. In the same file, update the `database_id` value for the `prod-db` with the UUID for `prod-db` you copied earlier:

```
"database-name": "test-db",
"database_id": "<paste your test-db uuid here>",
```

17. Commit the changes, push to your branch, create a Pull Request, and merge to main

18. Back in the Cloudflare dashboard, Go to Build --> Workers & Pages, and click Create Application. On the bottom, where it says Looking to deploy Pages? Get started, click Get started.

19. Next to Import an existing Git repository, click Get Started

20. In the popup that appears to Install & Authorize Cloudflare Workers and Pages, click Only select repositories, select the repository you forked in the Select Repositories dropdown, and then click Install & Authorize

21. Under Select a repository, click on the forked repository name to select it, and then click Begin setup

22. Under Build command, use: `npm run build`

23. Under Build output directory, use `dist`

24. Click the carrot next to Root directory (advanced) to expand it, and for path, use: `task-manager`

25. Click Save and Deploy, and then click Continue to project

26. Copy the URL for the production build that is listed under Domains and save it to a local text file, it should end in `.pages.dev`

27. Click on the Workers and Pages section at the top to go back to the main view, and then copy your Account ID and save it to a text file

28. Go back to your GitHub repository, go to Settings, click on Secrets and variables on the left hand side, then click on Actions, and then click New repository secret

29. Under secret name, use `CF_API_TOKEN_TEST`, and the saved `d1-edit-access-test` token value as the secret

30. Repeat the process, clicking New repository secret to add an additional secret, using the name `CF_API_TOKEN_PROD`, and the saved `d1-edit-access-prod` token value as the secret 

31. Repeat the process one last time, clicking New repository secret, using the name `CLOUDFLARE_ACCOUNT_ID`, and the saved account ID as the secret

32. Go to https://console.cloud.google.com/ and log into your Google account, if not already logged in, and agree to the terms of service if using Google Cloud for the first time

33. Click Create project, enter a project name, and click Create

34. Go to https://console.cloud.google.com/auth/clients, select the project you created if not already automatically selected, and click Get started

35. Enter an app name and select your email from the drop down, and then click Next

36. Under Audience, click External, and then click Next

37. Under contact information, enter your email address, and then click Next

38. Agree to the user data policy, click Continue, and then click Create

39. On the left hand side, click Clients, and then click Create client

40. In the Application type drop down, select Web application, enter a name, and then under Authorized JavaScript origins, click Add URI, type in `http://localhost`

41. Repeat the process, adding another URI and typing in `https://paste-cloudflare-url-here`, replacing paste-cloudflare-url-here with the Cloudflare Pages URL you previously copied

42. Repeat the Add URI process one last time, typing in `https://test.paste-cloudflare-url-here`, and replacing paste-cloudflare-url-here with the Cloudflare Pages URL you previously copied

43. Under Authorized redirect URIs, click Add URI, and enter `http://localhost/api/auth/callback`

44. Repeat the process for the Authorized redirect URIs, adding two more URIs for `https://paste-cloudflare-url-here/api/auth/callback` and `https://test.paste-cloudflare-url-here/api/auth/callback`, replacing paste-cloudflare-url-here with the Cloudflare Pages URL you previously copied

45. Click Create, and download the JSON file, which saves the Client ID, Client secret, and redirect URIs locally, which will be used in subsequent steps, as well as in the README for setting up local development variables, so be sure to save it securely

46. Click OK and then in the Cloudflare dashboard, go to Compute --> Workers & Pages --> click on your created task manager app, and then click on Settings, ensuring that Production is selected as the environment

47. Scroll down to Variables and Secrets, and click Add

48. For the variable name, use `GOOGLE_CLIENT_ID` and then for the value, enter the copied `GOOGLE_CLIENT_ID` value from the JSON you saved previously, make sure the type is Secret, and click Save

49. Under Variables and Secrets, click Add again, this time using `GOOGLE_CLIENT_SECRET` for the variable name, the `GOOGLE_CLIENT_SECRET` value from the JSON you saved previously, and the type as Secret

50. Under Variables and Secrets, click Add again, this time using `GOOGLE_REDIRECT_URI` for the variable name, and https://paste-cloudflare-url-here/api/auth/callback as the value, replacing paste-cloudflare-url-here with the Cloudflare Pages URL you previously copied, and the type as Secret

51. Under Variables and Secrets, click Add again, this time using `JWT_SECRET` for the variable name, and use a generated JWT secret as the value (you can follow this guide: https://dev.to/tkirwa/generate-a-random-jwt-secret-key-39j4), and the type as Secret

52. At the top of the page, under Choose Environment, select Preview

53. Under Variables and Secrets, click Add, and repeat the process with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `JWT_SECRET` variable names and values, with the type as Secret

54. In your IDE, edit the `task-manager/functions/api/auth/login.js` file, updating `team-teal-task-manager` to your CloudFlare URL for `PAGES_DEV_DOMAIN` and `TEST_SUBDOMAIN` values, (making sure to keep any leading prefixes before `team-teal-task-manager`):

```
const PAGES_DEV_DOMAIN = "cloudflare-url.pages.dev";
const TEST_SUBDOMAIN = "test.cloudflare-url.pages.dev";
```

Replacing cloudflare-url with the main branch url in between `https://` and `.pages.dev.`

55. Repeat the process in the `task-manager/functions/api/auth/logout.js` file, updating the `PAGES_DEV_SUFFIX` and `COOKIE_DOMAIN` values to match your Cloudflare URL (making sure to keep any leading prefixes before `team-teal-task-manager`):

```
const PAGES_DEV_SUFFIX = ".team-teal-task-manager.pages.dev";
const COOKIE_DOMAIN = "team-teal-task-manager.pages.dev";
```

56. Repeat the process one last time for the `task-manager/functions/api/auth/callback.js` file, updating the values for `PAGES_DEV_SUFFIX`, `COOKIE_DOMAIN`, and `TEST_SUBDOMAIN` (making sure to keep any leading prefixes before `team-teal-task-manager`):

```
const PAGES_DEV_SUFFIX = ".team-teal-task-manager.pages.dev";
const COOKIE_DOMAIN = "team-teal-task-manager.pages.dev";
const TEST_SUBDOMAIN = "test.team-teal-task-manager.pages.dev";
```

57. Commit your changes to your development branch, create a PR, and merge to main.

58. Back in GitHub, go to Actions, and rerun the workflow for any failed jobs

59. Keep in mind it can take 2-3 hours for the Google secrets to sync for login to work

60. You should be able to access your main build through the `<value>.pages.dev` URL for your main branch, or for the preview URLs displayed for your preview branches

61. You can find these URL values on the main or development (preview) branches by clicking the green or yellow dot (or red x for any failed workflows) on GitHub when viewing the branch, and then clicking Details next to Cloudflare Pages -- this is where you will see the preview URL as well as whether the build was successful or not
