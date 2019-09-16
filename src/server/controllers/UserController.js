import ServerConfig from '../config/ServerConfig';

export default class UserController {

  // Create single user.
  static createUser(req, res, next, db) {

    db.models.User.create(req.body, (err, user) => {
      if (err) {
        console.error(err);
        res.status(500).send();
      } else {
        res.status(200).send("User is saved successfully.");
      }
    });
  }

  // Create many user.
  static createUsers(req, res, next, db) {

    db.models.User.create(req.body, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send();
      } else {
        res.status(200).send("Users are saved successfully.");
      }
    })
  }

  // List single user by email.
  static readUserByEmail(req, res, next, db) {

    db.models.User.findOne({
      email: req.query.email
    })
      .exec((err, user) => {
        if (err) {
          console.error(err);
          res.status(500).send();
        } else {
          res.status(200).send(user);
        }
      });
  }

  // List all users.
  static readUsers(req, res, next, db) {
    db.models.User.find().sort({ "_id": 1 }).exec((err, users) => {
      res.send(users);
    });
  }

  static readUsersByPage(req, res, next, db, redisMiddleware) {
    var age = Math.max(0, req.query.age);
    var limit = Math.max(0, req.query.limit);
    var page = Math.max(-1, req.query.page);

    if (page < 0) {
      // Return every records.
      UserController.readUsers(req, res, next, db);
    } else {
      // Limit and page the result.
      db.models.User.find({
        age: { $gte: age }
      })
        .limit(limit)
        .skip(limit * page)
        .sort({ age: 1 })
        .exec((err, users) => {
          if (err) {
            console.error(err);
            res.status(500).send();
          } else {
            // Cache the data.
            const key = redisMiddleware.generateCacheKey(req.path, req.query.age, req.query.page);
            redisMiddleware.redisClient.setex(key, ServerConfig.REDIS_CACHE_TIMEOUT, JSON.stringify(users));
            console.log(`Response is cached with key: ${key}`);

            res.status(200).send(users);
          }
        });
    }
  }

  // Update user.
  static updateUserByEmail(req, res, next, db) {
    db.models.User.findOneAndUpdate({
      email: req.query.email
    }, req.body, (err, user) => {
      if (err) {
        console.error(err);
        res.status(500).send();
      } else {
        res.status(200).send(`User ${user.email} updated.`);
      }
    })
  }

  // Delete user.
  static deleteUserByEmail(req, res, next, db) {
    db.models.User.remove({
      email: req.query.email
    }, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send();
      } else {
        res.status(200).send(`User ${req.query.email} deleted.`);
      }
    })
  }

  // Delete all users.
  static deleteUsers(req, res, next, db) {
    db.models.User.remove({}, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send();
      } else {
        res.status(200).send("Users are deleted.");
      }
    })
  }
}