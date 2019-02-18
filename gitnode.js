var exec = require('child_process').exec;
var fs = require('fs');
var mkdirp = require('mkdirp');

/*
 *	GitNode: gestione clone e comandi di pull di repository
 *  Author: RC
 */
module.exports = class gitNode {
	constructor() {
	  this.repository = '';
	  this.localFolder = '';
	  this.logIO = null;
	}
	Update(callback)
	{
		var self = this;
		if (!fs.existsSync(self.localFolder+"/.git"))
		{
			self.Clone(function(last_commit)
			{
				return callback(last_commit);
			});
		}
		else
		{
			self.Pull(function(last_commit)
			{
				return callback(last_commit);
			});
		}
	}
	
	LastCommit (callback)
	{
		var self = this;
		var last_commit = null;
		exec("cd \""+self.localFolder+"\" && git rev-parse HEAD", function(error, stdout, stderr)
		{
			if (stdout) last_commit = stdout;
			callback(last_commit);
		})
	}
	
	Clone(callback) {
		var self = this;
		console.log(self.localFolder);
		self.Reset(self.localFolder);
		if (!fs.existsSync(self.localFolder)) mkdirp.sync(self.localFolder);
		self.ExecCommand("cd \""+self.localFolder+"\" && git clone --progress "+self.repository+" .",false, function()
		{
			self.LastCommit(function(last_commit)
			{
				return callback(last_commit);
			});
		});
	}
	Pull(callback){
		var self = this;
		self.ExecCommand("cd \""+self.localFolder+"\" && git fetch origin",false,function()
		{
			self.ExecCommand("cd \""+self.localFolder+"\" && git reset --hard origin/master",false,function()
			{
				self.ExecCommand("cd \""+self.localFolder+"\" && git pull",false,function()
				{
					self.LastCommit(function(last_commit)
					{
						return callback(last_commit);
					});
				});
			});
		});
	}
	ExecCommand(command,enable_log,callback)
	{
		var self = this;
		exec(command, function(error, stdout, stderr)
		{
			if (enable_log)
			{
				if (error) self.Logger(error); 
				if (stdout) self.Logger(stdout); 
				if (stderr) self.Logger(stderr); 
			}
			callback();
		});
	}
	Reset(path)
	{
		var self = this;
		if (fs.existsSync(path)) 
		{
		 	fs.readdirSync(path).forEach(function(file, index)
		  	{
				var curPath = path + "/" + file;
				if (fs.lstatSync(curPath).isDirectory()) 
				{ // recurse
				 	 self.Reset(curPath);
				} else { // delete file
			  		fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(path);
		}
	}
	Logger (data)
	{
		if (this.logIO)
			this.logIO(data);
		//else
		//	console.log(data);
	}
}
