import { Router } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import PlexTvAPI from '../api/plextv';

const authRoutes = Router();

authRoutes.post('/login', async (req, res) => {
  const userRepository = getRepository(User);
  const body = req.body as { authToken?: string };

  if (!body.authToken) {
    return res.status(500).json({ error: 'You must provide an auth token' });
  }
  try {
    // First we need to use this auth token to get the users email from plex tv
    const plextv = new PlexTvAPI(body.authToken);
    const account = await plextv.getUser();

    // Next let's see if the user already exists
    let user = await userRepository.findOne({
      where: { email: account.email },
    });

    if (user) {
      // Let's check if their plex token is up to date
      if (user.plexToken !== body.authToken) {
        user.plexToken = body.authToken;
        await userRepository.save(user);
      }
    } else {
      // Here we check if it's the first user. If it is, we create the user with no check
      // and give them admin permissions
      const totalUsers = await userRepository.count();

      if (totalUsers === 0) {
        user = new User({
          email: account.email,
          plexToken: account.authToken,
          // TODO: When we add permissions in #52, set admin here
        });
        await userRepository.save(user);
      }

      // If we get to this point, the user does not already exist so we need to create the
      // user _assuming_ they have access to the plex server
      // (We cant do this until we finish the settings sytem and actually
      // store the user token in ticket #55)
    }

    // Set logged in session
    if (req.session && user) {
      req.session.userId = user.id;
    }

    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: 'Something went wrong. Is your auth token valid?' });
  }
});

export default authRoutes;
