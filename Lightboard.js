function initLightboard() {
  width = 1280;
  height = 720;
  video = //document.getElementById("video");
              document.createElement("video");
  video.setAttribute("height",height);
  video.setAttribute("width",width);
  //document.body.insertBefore(video, document.body.firstChild);
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  context = canvas.getContext("2d");
  lightboard = document.getElementById("lightboard");
  lbc = lightboard.getContext("2d");
  pixel = lbc.createImageData(1,1);
  lbc.fillStyle = 'red';
  pData = pixel.data;
  pData[3] = 255;
  
  calibStage = 0;
  calibFrame = 0;
  
  var me = this;
  var videoLoop = function() {
    context.drawImage(video, 0, 0, width, height);
    img_data = context.getImageData(0, 0, width, height).data;
    sparklePointer(img_data);
    setTimeout(videoLoop, 17);
  };
  getUserMedia({
    video: true,
    audio: false
  }, function(stream) {
    video.src = window.URL.createObjectURL(stream);
    video.play();
    videoLoop();
  }, function(error) {
    console.log(error);
  });
};

function invertMatrix2(mat) {
  det = mat[0][0]*mat[1][1]-mat[0][1]*mat[1][0];
  ret = [[mat[1][1]/det, -mat[0][1]/det],
         [-mat[1][0]/det, mat[0][0]/det]];
  return ret;
}

function invertMatrix3(a) {
  var ret = [[],[],[]];
  var det = 0;
  for(var i=0;i<3;i++)
      det += (a[0][i]*(a[1][(i+1)%3]*a[2][(i+2)%3] - a[1][(i+2)%3]*a[2][(i+1)%3]));
	for(i=0;i<3;i++){
      for(j=0;j<3;j++)
           ret[j][i] = ((a[(i+1)%3][(j+1)%3] * a[(i+2)%3][(j+2)%3]) - (a[(i+1)%3][(j+2)%3]*a[(i+2)%3][(j+1)%3]))/ det;
  }
  return ret;
}

function matrixMult(mat1, mat2) {
  ret = [];
  for (var i = 0; i < mat1.length; ++i) {
    ret[i] = [];
    for (var j = 0; j < mat2[0].length; ++j) {
      var sum = 0;
      for (var k = 0; k < mat2.length; ++k) {
        sum += mat1[i][k]*mat2[k][j];
      }
      ret[i][j] = sum;
    }
  }
  return ret;
}

function matrixRight(mat, vec) {
  ret = [];
  for (var r = 0; r < vec.length; ++r) {
    var sum = 0;
    for (var c = 0; c < vec.length; ++c) {
      sum += vec[c]*mat[r][c];
    }
    ret[r] = sum;
  }
  return ret;
}

function matrixSum(mat, add) {
  for (var r = 0; r < mat.length; ++r) {
    for (var c = 0; c < mat[0].length; ++c) {
      mat[r][c] += add[r][c];
    }
  }
  return mat;
}

function divideVec(vec,num) {
  for (var r = 0; r < vec.length; ++r) {
    vec[r] /= num;
  }
  return vec;
}
function divideMatrix(mat,num) {
  for (var r = 0; r < mat.length; ++r) {
    for (var c = 0; c < mat[0].length; ++c) {
      mat[r][c] /= num;
    }
  }
  return mat;
}

function tMatrix3(mat) {
  for (var r = 0; r < mat.length; ++r) {
    for (var c = r+1; c < mat[0].length; ++c) {
      var swap = mat[r][c];
      mat[r][c] = mat[c][r];
      mat[c][r] = swap;
    }
  }
}

function calibrate() {
  context.drawImage(video, 0, 0, width, height);
  img_data = context.getImageData(0, 0, width, height).data;
  
  xDensity = [];
  yDensity = [];
  if (calibStage == 0) {
    console.log("setup 0");
    lightboard.width = window.innerWidth - 20;
    lightboard.height = window.innerHeight - 20;
    
    lbc.setTransform(1, 0, 0, 1, 0, 0);
    lbc.scale(lightboard.width, lightboard.height);
    lbc.fillStyle = 'white';
    lbc.fillRect(0, 0, 1, 1);
    
    console.log("ready 0");
    setTimeout(calibrate, 1000);
    
    ++calibStage;
  } else if (calibStage == 1) {
    console.log("calibrate 1");
    var sampling = 8;
    
    for (var y = 0; y < height; ++y) {
      yDensity[y] = 0;
    }
    for (var x = 0; x < width; ++x) {
      xDensity[x] = 0;
    }
    
    pData[0] = 0; pData[1] = 0; pData[2] = 0;
    var ind = -Math.log(Math.random())*sampling >>> 0;
    while(ind < height*width) {
      var x = ind % width >>> 0;
      var y = ind / width >>> 0;
      var b = img_data[ind*4] + img_data[ind*4+1] + img_data[ind*4+2];
      
      //if (Math.random() > 0.999) { console.log(b); }
      if (b > 360) {
        yDensity[y] += 1;
        xDensity[x] += 1;
      }
      
      ind += -Math.log(Math.random())*sampling >>> 0;
    }
    
    minY = -1; maxY = -1;
    minX = -1; maxX = -1;
    
    for (var x = 0; x < width; ++x) {
      if (xDensity[x] / width * sampling > 0.25) {
        if (minX < 0) {
          minX = x;
        } else {
          maxX = x+1;
        }
      }
    }
    for (var x = 0; x < height; ++x) {
      if (yDensity[x] / width * sampling > 0.25) {
        if (minY < 0) {
          minY = x;
        } else {
          maxY = x+1;
        }
      }
    }
    
    console.log(minX);
    console.log(maxX);
    console.log(minY);
    console.log(maxY);
    
    console.log("done 1");
    
    setTimeout(calibrate, 80);
    
    ++calibStage;
  } else if (calibStage == 2) {
    console.log("setup 2");
    
    lbc.fillStyle = 'black';
    lbc.clearRect(0, 0, 1, 1);
    
    var cst = 0.1;
    
    if (calibFrame == 1) {
      cst = 0.5;
    } else if (calibFrame == 2) {
      cst = 0.9;
    }
    
    lbc.fillStyle = '#006600';
    lbc.fillRect(cst-0.01125,0.0,0.0225,1.0);
    
    lbc.fillStyle = '#660000';
    lbc.fillRect(0.0,cst-0.02,1.0,0.04);
    
    console.log("ready 2");
    
    if (calibFrame == 0) {
      setTimeout(calibrate, 600);
    } else {
      setTimeout(calibrate, 300);
    }
    
    ++calibStage;
  } else if (calibStage == 3) {
    console.log("calibrate 3");
    
    if (calibFrame == 0) {
      sts = [0, 0, 0, 0, 0, 0];
      st = [0, 0, 0, 0, 0, 0];
      ss = [0, 0, 0, 0, 0, 0];
      stt = [0, 0, 0, 0, 0, 0];
      n = [0, 0, 0, 0, 0, 0];
      slope = [0, 0, 0, 0, 0, 0];
      inter = [0, 0, 0, 0, 0, 0];
    }
    
    var sampling = 4;
    
    var ind = minX + minY*width - Math.log(Math.random())*sampling >>> 0;
    
    while(ind < width*maxY) {
      var x = ind % width >>> 0;
      var y = ind / width >>> 0;
      
      if (x > maxX && y < maxY - 1) {
        ind += width-maxX+minX;
        x = ind % width >>> 0;
        y += 1;
      }
      
      var red = img_data[ind*4];
      var green = img_data[ind*4+1]
      
      if (red > 250 && red > green + 10) {
        var r = calibFrame;
        sts[r] += x*y;
        stt[r] += x*x;
        st[r] += x;
        ss[r] += y;
        n[r] += 1;
        //pData[0] = 255;
      } else if (green > 250 && green > red + 10) {
        var r = calibFrame + 3;
        sts[r] += x*y;
        stt[r] += y*y;
        st[r] += y;
        ss[r] += x;
        n[r] += 1;
        //pData[1] = 255;
      }
      
      //lbc.putImageData(pixel, x, y);
      
      ind += -Math.log(Math.random())*sampling >>> 0;
    }
    
    if (calibFrame == 2) {
      lbc.setTransform(1, 0, 0, 1, 0, 0);
      
      for (var i = 0; i < 6; ++i) {
        slope[i] = (sts[i] - st[i]*ss[i]/n[i])/(stt[i] - st[i]*st[i]/n[i]);
        inter[i] = (ss[i] - slope[i]*st[i])/n[i];
        
        lbc.beginPath();
        if (i < 3) {
          lbc.moveTo(0, inter[i]);
          lbc.lineTo(width, inter[i]+slope[i]*width);
        } else {
          lbc.moveTo(inter[i], 0);
          lbc.lineTo(inter[i]+slope[i]*height, height);
        }
        lbc.lineWidth = 3;
        
        lbc.strokeStyle = '#ffffff';
        lbc.stroke();
        
      }
      
      inv = [[0,0,0],[0,0,0],[0,0,0]];
      
      for (var x1 = 0; x1 < 2; ++x1) {
        for (var x2 = x1+1; x2 < 3; ++x2) {
          for (var y1 = 0; y1 < 2; ++y1) {
            for (var y2 = y1+1; y2 < 3; ++y2) {
              /*
              var yiv = (inter[y2]-inter[y1])/(slope[y1]-slope[y2]);
              var xiv = inter[y1]+slope[y1]*yiv;
              
              var xiw = (inter[x2]-inter[x1])/(slope[x1]-slope[x2]);
              var yiw = inter[x1]+slope[x1]*xiw;
              
              var ps = matrixRight(invertMatrix2([[xiv, yiv], [xiw, yiw]]), [-1,-1]);
              
              var proj = [[1,0,0],[0,1,0],[ps[0],ps[1],1]];
              */
              
              var yi0 = (slope[x1]*inter[y1+3]+inter[x1])/
                  (1-slope[x1]*slope[y1+3]);
              var xi0 = yi0*slope[y1+3]+inter[y1+3];
              //var v0 = matrixRight(proj,[xi0, yi0, 1]);
              var v0 = [xi0, yi0, 1];
              //divideVec(v0, v0[2]);
              
              var yix = (slope[x1]*inter[y2+3]+inter[x1])/
                  (1-slope[x1]*slope[y2+3]);
              var xix = yix*slope[y2+3]+inter[y2+3];
              //var vx = matrixRight(proj,[xix, yix, 1]);
              var vx = [xix, yix, 1];
              //divideVec(vx, vx[2]);
              
              var yiy = (slope[x2]*inter[y1+3]+inter[x2])/
                  (1-slope[x2]*slope[y1+3]);
              var xiy = yiy*slope[y1+3]+inter[y1+3];
              //var vy = matrixRight(proj,[xiy, yiy, 1]);
              var vy = [xiy, yiy, 1];
              //divideVec(vy, vy[2]);
              
              var matlT = [[0.1+y1*0.4, 0.1+x1*0.4, 1],
                          [0.1+y2*0.4, 0.1+x1*0.4, 1],
                          [0.1+y1*0.4, 0.1+x2*0.4, 1]];
              var matrT = invertMatrix3([v0, vx, vy]);
              var coefs = matrixMult(matrT, matlT);
              tMatrix3(coefs);
              divideMatrix(coefs,coefs[2][2]);
              
              matrixSum(inv, coefs);
            }
          }
        }
      }
      
      divideMatrix(inv, inv[2][2]);
      console.log("done 3");
      ++calibStage;
    } else {
      console.log("repeat 3");
      --calibStage;
      ++calibFrame;
    }
    
    setTimeout(calibrate, 80);
  } else if (calibStage == 4) {
    console.log("clear 4");
    
    
    lbc.clearRect(0, 0, lightboard.width, lightboard.height);
    
    setTimeout(calibrate, 300);
    ++calibStage;
  } else if (calibStage == 5) {
    console.log("running 5");
    ++calibStage;
  }
}

function sparklePointer(img_data) {
  if (calibStage == 6) {
    var sampling = 4;
      
    var ind = minX + minY*width - Math.log(Math.random())*sampling >>> 0;
    
    lbc.fillStyle = '#0000ff';
    
    var sxx=0,syy=0,sxy=0,sx=0,sy=0,n=0;
    
    while(ind < width*maxY) {
      var x = ind % width >>> 0;
      var y = ind / width >>> 0;
      
      if (x > maxX && y < maxY - 1) {
        ind += width-maxX+minX;
        x = ind % width >>> 0;
        y += 1;
      }
      
      var yr = (y-minY)/(maxY-minY);
      var xr = (x-minX)/(maxX-minX);
      
      var red = img_data[ind*4];
      var b = img_data[ind*4] + img_data[ind*4+1] + img_data[ind*4+2];
      
      if (red > 245 && b > 360) {
        var np = matrixRight(inv, [x, y, 1]);
        divideVec(np, np[2]);
        var nx = np[0]*lightboard.width;
        var ny = np[1]*lightboard.height;
        sxx += nx*nx;
        syy += ny*ny;
        sxy += ny*nx;
        sx += nx;
        sy += ny;
        n += 1;
        lbc.fillRect(nx-2,ny-2,5,5);
      }
      
      ind += -Math.log(Math.random())*sampling >>> 0;
    }
  }
}
