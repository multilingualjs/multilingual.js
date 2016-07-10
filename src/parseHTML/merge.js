var merge = function( first, second ) {
	var len = +second.length,
		j = 0,
		i = first.length;

	for ( ; j < len; j++ ) {
		first[ i++ ] = second[ j ];
	}

	first.length = i;

	return first;
}

module.exports = merge;