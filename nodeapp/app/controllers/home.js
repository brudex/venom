const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const HomeController = {};
module.exports = HomeController;


HomeController.getArticles = (req,res) => {
  Article.find((err, articles) => {
    if (err) return next(err);
    res.render('index', {
      title: 'Venom-Express MVC',
      articles: articles
    });
  });
}

module.exports = HomeController;

