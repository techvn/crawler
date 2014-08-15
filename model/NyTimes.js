/**
 */

var NyTimes = module.exports.NyTimes = function(s) {
    var s = s || {};
    this.title = s.title || '';
    this.brief = s.brief || '';
    this.img = s.img || [];
    this.video = s.video || "";
    this.content = s.content || '';
    this.comments = s.comments || [];
    this.author = s.author || '';
    this.publish = s.publish || new Date().toString();
    this.domain = 'http://nytimes.com';
    this.link = s.link || '';

    return this;
}
