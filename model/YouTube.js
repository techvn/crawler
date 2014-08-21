/**
 * Created by Administrator PC on 8/20/14.
 */

var YouTube = module.exports.YouTube = function(s) {
    var s = s || {};

    this.title = s.title || '';
    this.brief = s.brief || '';
    this.img = s.img || [];
    this.video = s.video || ""; // Link video
    this.content = s.content || ''; // YouTube have no content
    this.comments = s.comments || [];
    this.author = s.author || '';
    this.publish = s.publish || new Date().toString();
    this.domain = 'youtube.com';
    this.link = s.link || ''; // Link detail

    return this;
}