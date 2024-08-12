module.exports = (req, res, next) => {
    if (req.session.isAdmin) {
      next();
    } else {
      req.session.error = "Access failed";
      res.redirect("/");
    }
  };
  