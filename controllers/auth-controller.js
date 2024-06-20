const knex = require("knex")(require("../knexfile"));
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send("Please enter the required fields");
  }

  const exists = await knex("users").where({ email: email });

  if (exists.length !== 0) {
    return res.status(400).json({
      message: "email already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    username,
    email,
    password: hashedPassword,
  };

  try {
    await knex("users").insert(newUser);
    res.status(201).send("Registered successfully!");
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

  //Find user
  const user = await knex("users").where({ email: email }).first();

  if (!user) {
    return res.status(400).send("Invalid email");
  }

  //Validate password
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(400).send("Invalid email or password");
  }

  // Generate a token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_KEY,
    { expiresIn: "24h" }
  );

  res.send({ token });
};

const fetchUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);

    const user = await knex("users")
      .select("id", "username", "email")
      .where({ id: decodedToken.id })
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) { console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

module.exports = {
  register,
  login,
  fetchUser,
};
