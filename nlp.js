var pos = require('pos')
  , Snowball = require('snowball')
  , lexer = new pos.Lexer()
  , tagger = new pos.Tagger()
  , stemmer = new Snowball('english');

module.exports = {
  parse: parse
};

function lex(document) {
  return lexer.lex(document);
}

function stem(word) {
  stemmer.setCurrent(word);
  stemmer.stem();
  return stemmer.getCurrent(word);
}

function tag(words) {
  return tagger.tag(words);
}

function stopword(word) {
  return STOPWORD_HASH[word] || false;
}

function removePunctuation(word) {
  return word.replace(/[^\w]/g,'');
}

function lowerCase(word) {
  return word.toLowerCase();
}

function parse(document) {
  var ps = tag(lex(document));
  return ps.map(function(p) {
    var clean = lowerCase(removePunctuation(p[0]));

    return {
      phrase: p[0],
      pos: p[1],
      stopword: stopword(clean),
      stem: clean && (p[1] === 'URL' ? p[0] : (p[0][0] === '@' ? ('@' + clean) : stem(clean)))
    };
  });
}

var STOPWORDS = [ "a", "about", "above", "across", "after", "afterwards",
    "again", "against", "all", "almost", "alone", "along", "already", "also",
    "although", "always", "am", "among", "amongst", "amoungst", "amount", "an",
    "and", "another", "any", "anyhow", "anyone", "anything", "anyway",
    "anywhere", "are", "around", "as", "at", "back", "be", "became", "because",
    "become", "becomes", "becoming", "been", "before", "beforehand", "behind",
    "being", "below", "beside", "besides", "between", "beyond", "bill", "both",
    "bottom", "but", "by", "call", "can", "cannot", "cant", "co", "computer",
    "con", "could", "couldnt", "cry", "de", "describe", "detail", "do", "done",
    "down", "due", "during", "each", "eachother", "eg", "eight", "either",
    "eleven", "else", "elsewhere", "empty", "enough", "etc", "even", "ever",
    "every", "everyone", "everything", "everywhere", "except", "few", "fifteen",
    "fify", "fill", "find", "fire", "first", "five", "for", "former", "formerly",
    "forty", "found", "four", "from", "front", "full", "further", "get", "give",
    "go", "had", "has", "hasnt", "have", "he", "hence", "her", "here",
    "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "him",
    "himself", "his", "how", "however", "hundred", "i", "ie", "if", "in", "inc",
    "indeed", "interest", "into", "is", "it", "its", "itself", "keep", "last",
    "latter", "latterly", "least", "less", "ltd", "made", "many", "may", "me",
    "meanwhile", "might", "mill", "mine", "more", "moreover", "most", "mostly",
    "move", "much", "must", "my", "myself", "name", "namely", "neither", "never",
    "nevertheless", "next", "nine", "no", "nobody", "none", "noone", "nor",
    "not", "nothing", "now", "nowhere", "of", "off", "often", "on", "once",
    "one", "only", "onto", "or", "other", "others", "otherwise", "our", "ours",
    "ourselves", "out", "over", "own", "part", "per", "perhaps", "please", "put",
    "rather", "re", "rt", "same", "see", "seem", "seemed", "seeming", "seems", "serious",
    "several", "she", "should", "show", "side", "since", "sincere", "six", "sixty",
    "so", "some", "somehow", "someone", "something", "sometime", "sometimes",
    "somewhere", "still", "such", "system", "take", "ten", "than", "that", "the",
    "their", "them", "themselves", "then", "thence", "there", "thereafter",
    "thereby", "therefore", "therein", "thereupon", "these", "they", "thick",
    "thin", "third", "this", "those", "though", "three", "through", "throughout",
    "thru", "thus", "to", "together", "too", "top", "toward", "towards", "twelve",
    "twenty", "two", "un", "under", "until", "up", "upon", "us", "very", "via",
    "was", "we", "well", "were", "what", "whatever", "when", "whence", "whenever",
    "where", "whereafter", "whereas", "whereby", "wherein", "whereupon",
    "wherever", "whether", "which", "while", "whither", "who", "whoever", "whole",
    "whom", "whose", "why", "will", "with", "within", "without", "would", "yet",
    "you", "your", "yours", "yourself", "yourselves" ]
  , STOPWORD_HASH = STOPWORDS.reduce(function(o, i) { o[i] = true; return o; }, {});
