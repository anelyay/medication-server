const knex = require("knex")(require("../knexfile"));
const jwt = require("jsonwebtoken");

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

  const newUser = {
    username,
    email,
    password,
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
  if (password !== user.password) {
    return res.status(400).send("Invalid password");
  }

  // Generate a token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_KEY,
    { expiresIn: "24h" }
  );

  res.send({ token });
};

module.exports = {
  register,
  login,
};
