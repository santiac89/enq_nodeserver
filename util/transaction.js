var Transaction = function(docs) {

  if (!(this instanceof Transaction))
    return new Transaction(docs);

  this.docs = docs;
  this.rollbacks = [];
  this.rollback_failed = false;

  this.save = function(callback) {
     this._save(this.docs,callback == undefined ? function(){} : callback);
  }

  this._save = function(docs,callback) {

    if (!docs.length) {
      callback(undefined);
      return;
    }

    var doc = docs[0];

    var _this = this;

    doc.save(function(err) {

      if (err) _this.rollback(callback);

      _this.rollbacks.push({doc: doc, backup: doc.backup() });
      _this._save(docs.slice(1), callback);

    });

  }

  this.rollback = function(callback) {
    var _this = this;

    for (i=0; i < this.rollbacks;i++) {
        if (!this.rollback_failed) {
          this.rollbacks[i].doc.restore(this.rollbacks[i].backup);
          this.rollbacks[i].doc.save(function(err) {
            if (err) {
              _this.rollback_failed = true;
              callback(err);
            }
          });
        }
    }
  }

}


module.exports = Transaction;
