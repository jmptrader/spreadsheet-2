//load_data = function() {
  //console.log('oops');
  //return "";
//};
//save_data = function() {
  //console.log('oops');
  //return "";
//};

$(function() {

  // TEMPLATES
  var rowTemplate = function(params) {
    return "<tr>"+
      //"<td class='index'>"+params.rowIndex+"</td>"+
      params.data+
      "</tr>"
  }
  var rowDataTemplate = function(params) {
    var value = (params.value || params.value==0)?params.value:'';
    return "<td id=\""+params.colName+params.rowIndex+"\" class=\""+params.colName+" "+params.rowIndex+"\" data-row=\""+params.rowIndex+"\" data-col=\""+params.colIndex+"\">"+value+"</td>";
  }

  // convert index to column identifier, eg AA, BA, CC
  var colName = function(idx) {
    var s = '';
    while (idx>=0) {
      s = String.fromCharCode(idx%26+65) + s;
      idx = Math.floor(idx/26)-1;
    }
    return s;
  };

  var maxRowIndex = 8;
  var maxColumnIndex = 8;

  var emptyRow = function(rowWidth) {
    return new Array(rowWidth+1).join(' ').split(' ');
  }

  var maxRowLength = function(data) {
    return Math.max.apply(window, data.map(function(row){ return row.length; })) + 1;
  }

  var maxColLength = function(data) {
    return data.length;
  }

  var selectCell = function(row, col) {
    var selecter = '.'+row+'.'+colName(col);
    $cell = $(selecter)
    $cell.click();
  }

  var calculateFormulas = function() {
    $('td[formula]').each(function() {
      $target = $(this)
      var formula = $target.attr('formula');
      formula = formula.slice(1, formula.length);
      var calculated = eval(formula.replace(/([A-Z][0-9])/g, "parseInt(\$('#$1').html(),10)"));
      $target.html(calculated);
    });
  }

  var data = undefined;
  $('button#load').on('click', function(e) {
    e.preventDefault();
    $('tbody tr').remove();

    var key = $('input#key').val();
    data = JSON.parse(window.load_data(key));

    maxColIndex = maxRowLength(data);
    maxRowIndex = maxColLength(data);
    data.push(emptyRow(maxRowLength(data)));

    data.forEach(function(rowData, rowIndex) {
      var tableData = []
      for (var i = 0; i < maxColIndex; i++) {
        var value = rowData[i];
        tableData.push(rowDataTemplate({
          colName: colName(i),
          colIndex: i,
          rowIndex: rowIndex,
          value: value
        }));
      }

      var rowString = rowTemplate({rowIndex:rowIndex, data:tableData.join('')});
      $('table tbody').append(rowString);

    });

    var shift = false;
    $('table').off('click');
    $('table').on('click', function(e) {
      var $target = $(e.target);
      if (!$target.is('td')) return;

      var rowIndex = $target.data('row'),
          colIndex = $target.data('col');

      if ($target.attr('contenteditable') == 'true') {
        $target.attr('contenteditable', false);
      } else {
        $target.attr('contenteditable', true);
        $target.focus();
        $target.on('keyup', function(e) {
          switch (e.keyCode) {
            case 16: // shift
              shift = false;
              break;
          }
        });
        $target.on('keydown', function(e) {
          switch (e.keyCode) {
            case 16: // shift
              shift = true;
              break;
            case 37: // left
              if (shift)
                selectCell(rowIndex, colIndex-1);
              break;
            case 38: // up
              if (shift)
                selectCell(rowIndex-1, colIndex);
              break;
            case 39: // right
              if (shift)
                selectCell(rowIndex, colIndex+1);
              break;
            case 40: // down
              if (shift)
                selectCell(rowIndex+1, colIndex);
              break;
            case 13: // enter
              e.preventDefault();
              $target.blur();
              break;
            default:
              break;
          }
        });
        $target.one('blur', function(e) {
          var value = $target.text();

          data[rowIndex][colIndex] = value;
          if (value[0] === '=') {
            $target.attr('formula', value);
          } else {
            $target.text(value);
          }

          calculateFormulas();

          $target.off('keydown');
          $target.off('keyup');
          $target.attr('contenteditable', false);
        });
      }
    });

    var mousedown = false,
        startRow = startCol = endRow = endCol = null;

    var selectCells = function(startRow, startCol, endRow, endCol) {
      $('table td.selected').removeClass('selected');

      if (typeof endRow === 'undefined' && typeof endCol === 'undefined') {
        $('[data-row='+startRow+'][data-col='+startCol+']').addClass('selected');
        return;
      }

      if (startRow > endRow) {
        var temp = endRow;
        endRow = startRow;
        startRow = temp;
      }
      if (startCol > endCol) {
        var temp = endCol;
        endCol = startCol;
        startCol = temp;
      }

      for (var x = startCol; x <= endCol; x++) {
        for (var y = startRow; y <= endRow; y++) {
          $('[data-row='+y+'][data-col='+x+']').addClass('selected');
        }
      }
    };

    var deleteSelectedCells = function() {
      $('table td.selected').each(function() {
        var $cell = $(this),
            row = $cell.data('row'),
            col = $cell.data('col'),
            value = '';

        data[row][col] = value;
        $cell.text(value);
      });
      calculateFormulas();
    };

    $('body').on('keydown', function(e) {
      switch (e.keyCode) {
        case 8: // delete
          if (!$('table td.selected').length) return;

          e.preventDefault();
          deleteSelectedCells();
          return false;
          break;
        default:
          break;
      }
    });

    $('table').on('mousedown', function(e) {
      var $startCell = $(e.target);
      mousedown = true;
      startRow = $startCell.data('row');
      startCol = $startCell.data('col');
      selectCells(startRow, startCol);
    });
    $('table').on('mousemove', function(e) {
      if (!mousedown) return;

      var $currCell = $(e.target);
      endRow = $currCell.data('row');
      endCol = $currCell.data('col');
      selectCells(startRow, startCol, endRow, endCol);
    });
    $('table').on('mouseup', function(e) {
      if (!mousedown) return;

      var $endCell = $(e.target);
      mousedown = false;
      endRow = $endCell.data('row');
      endCol = $endCell.data('col');
      $endCell.addClass('selected');
      selectCells(startRow, startCol, endRow, endCol);
    });

  });

  $('button#save').on('click', function(e) {
    e.preventDefault();

    tempData = data.map(function(row) {
      var v,
          tempRow = [];
      for (var i = row.length-1; i >= 0; i--) {
        if (row[i] === '' || row[i] === undefined) {
          continue;
        } else {
          tempRow = row.slice(0, i+1);
          break;
        }
      }
      return tempRow;
    });

    if (0 == Math.max(tempData[tempData.length-1].map(function(val) { return val.length }))) {
      tempData.splice(tempData.length-1, 1);
    }

    var key = $('input#key').val();
    save_data(key, JSON.stringify(tempData));
  });

  // EVERYTHING BELOW TO BE COMMENTED OUT

  var keyMap = {
    sample_data: '[[1], [2, 3], [4, 5, 6], [], [7, 8, 9, 0]]'
  };

  if (!window.load_data) {
    console.log('loading stub');
    window.load_data = function(key) {
      return keyMap[key];
    };
  }

  if (!window.save_data) {
    console.log('loading stub');
    window.save_data = function(key, data) {
      keyMap[key] = data;
    };
  }

  //$('button#load').click();
});
