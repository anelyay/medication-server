const knex = require("knex")(require("../knexfile"));
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");

const register = async (req, res) => {
  const { username, email, password, timezone } = req.body;

  if (!username || !email || !password || !timezone) {
    return res
      .status(400)
      .json({ message: "Please enter the required fields" });
  }

  const exists = await knex("users").where({ email: email });

  if (exists.length !== 0) {
        return res.status(400).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    username,
    email,
    password: hashedPassword,
    timezone,
  };

  try {
    await knex("users").insert(newUser);
    res.status(201).json({ message: "Registered successfully!" });
  } catch (error) {
    console.log(error);
    res.status(400).send("Registration failed!");
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Please enter the required fields");
  }

  try {
    const user = await knex("users")
      .select("id", "email", "password", "timezone", "last_login")
      .where({ email })
      .first();

    if (!user) {
      return res.status(400).send("Invalid email");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send("Invalid password");
    }

    const currentDate = moment().tz(user.timezone).format("YYYY-MM-DD");
    const lastLoginDate = user.last_login
      ? moment(user.last_login).format("YYYY-MM-DD") //this is technically in UTC but actually correct in user's timezone
      : null;

    console.log(
      `Current date: ${currentDate}, Last login date: ${user.last_login}, ${lastLoginDate}`
    );

    const isFirstLoginToday = !lastLoginDate || lastLoginDate !== currentDate;

    await knex.transaction(async (trx) => {
      if (isFirstLoginToday) {
        const numUpdated = await trx("schedule")
          .where({ user_id: user.id })
          .update({ med_taken: false });

        console.log(`updated ${numUpdated} rows for user ${user.id}`);

        if (numUpdated === 0) {
          console.log(`No rows updated for user ${user.id}`);
        }
      }

      const newLastLogin = moment()
        .tz(user.timezone)
        .format("YYYY-MM-DD HH:mm:ss");

      console.log(
        `Attempting to update last_login for user ${user.id} to ${newLastLogin}`
      );

      const rowsUpdated = await trx("users")
        .where({ id: user.id })
        .update({ last_login: newLastLogin });

      if (rowsUpdated === 0) {
        console.error(`Failed to update last_login for user ${user.id}`);
      } else {
        console.log(
          `updated last login for user ${user.id} to ${newLastLogin}`
        );
      }
      await trx.commit();
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );

    res.status(200).send({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Internal server error");
  }
};

const fetchUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);

    const user = await knex("users")
      .select("id", "username", "email", "timezone", "last_login")
      .where({ id: decodedToken.id })
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const userId = decodedToken.id;

    const { username, email, password, timezone } = req.body;

    if (!username && !email && !password) {
      return res
        .status(400)
        .send("Please provide at least one field to update");
    }

    const updates = {};

    if (username) {
      updates.username = username;
    }

    if (email) {
      const emailExists = await knex("users").where({ email }).first();
      if (emailExists && emailExists.id !== userId) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = email;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.password = hashedPassword;
    }

    if (timezone) {
      updates.timezone = timezone;
    }

    await knex("users").where({ id: userId }).update(updates);
    res.status(200).send("User updated successfully!");
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

const refresher = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);

    const user = await knex("users")
      .select("id", "username", "email", "timezone", "last_login")
      .where({ id: decodedToken.id })
      .first();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const medications = await knex("schedule")
      .select("id", "medication_id", "med_taken")
      .where({ user_id: user.id });

    console.log(
      `Medications are: ${JSON.stringify(medications)} for user ${user.id}`
    );

    await knex.transaction(async (trx) => {
      try {
        const numUpdated = await trx("schedule")
          .where({ user_id: user.id })
          .update({ med_taken: false });

        if (numUpdated === 0) {
          console.log(`No rows updated for user ${user.id}`);
        }

        await trx.commit();
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    });

    return res.status(200).json({ message: "Schedule updated successfully" });
  } catch (error) {
    console.error("Error in refresher function:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  fetchUser,
  updateUser,
  refresher,
};
