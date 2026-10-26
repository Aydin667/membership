from PIL import Image, ImageDraw, ImageFont
import numpy as np, wave, os, math, subprocess
W,H,FPS,DUR=1280,720,30,10.8
ROOT=os.path.dirname(os.path.dirname(__file__))
OUT=os.path.join(ROOT,'video')
FR=os.path.join(OUT,'frames'); os.makedirs(FR,exist_ok=True)
BG=(246,244,239); INK=(10,32,30); MUT=(92,109,104); ACC=(15,118,110); MINT=(121,230,199); WHITE=(255,253,248); LINE=(213,222,217); PALE=(224,245,238)
FONT='/usr/share/fonts/opentype/inter/Inter-Regular.otf'; BOLD='/usr/share/fonts/opentype/inter/Inter-Bold.otf'
def font(sz,b=True): return ImageFont.truetype(BOLD if b else FONT,sz)
def ease(x): x=max(0,min(1,x)); return 1-(1-x)**3
def txt(d,xy,s,sz,fill=INK,b=True,anchor=None): d.text(xy,s,font=font(sz,b),fill=fill,anchor=anchor)
def rounded(d,box,r,fill,outline=None,w=1): d.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=w)
def logo(d,x,y,s=56):
    rounded(d,(x,y,x+s,y+s),16,INK); d.polygon([(x+s*.72,y),(x+s,y),(x+s,y+s*.28)],fill=MINT)
    txt(d,(x+s*.5,y+s*.54),'M',int(s*.56),WHITE,True,'mm')
def header(d): logo(d,48,34,38); txt(d,(98,53),'MEMBERSHIP',18,INK,True,'lm')
def card(d,box,fill=WHITE): rounded(d,box,20,fill,LINE,2)
def scene(t):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im); header(d)
    d.ellipse((-120,540,650,980),fill=PALE)
    if t<1.45:
        p=ease(t/1.45); y=280+18*(1-p)
        txt(d,(70,y),'MOST COINS PAY',64,INK); txt(d,(70,y+74),'TINY REWARDS.',64,ACC)
        txt(d,(72,y+164),'What if the fee stream bought something holders actually use?',24,MUT,False)
        for i in range(16):
            a=(i*73)%360; r=90+(i%4)*19; cx=1010+math.cos(math.radians(a))*r; cy=352+math.sin(math.radians(a))*r
            d.ellipse((cx-5,cy-5,cx+5,cy+5),fill=(175,190,184))
    elif t<3.35:
        q=ease((t-1.45)/1.9); x=70
        txt(d,(x,238),'MEMBERSHIP TURNS FEES INTO',50,INK); txt(d,(x,300),'REAL HOLDER UTILITY.',64,ACC)
        benefits=[('Gas Pass','Sponsored transactions'),('Holder Terminal','Premium analytics'),('Wallet Shield','Safer signing')]
        for i,(a,b) in enumerate(benefits):
            yy=420+i*72; xx=x+int((1-q)*90)
            card(d,(xx,yy,610,yy+58)); d.ellipse((xx+16,yy+15,xx+44,yy+43),fill=PALE); txt(d,(xx+30,yy+29),'✓',17,ACC,True,'mm'); txt(d,(xx+58,yy+20),a,16,INK); txt(d,(xx+58,yy+40),b,12,MUT,False)
        px=770; py=210; card(d,(px,py,1165,510),INK); txt(d,(px+34,py+42),'DOG CLUB',15,MINT); txt(d,(px+34,py+110),'BLACK',58,WHITE); txt(d,(px+34,py+150),'34 days held',15,(165,197,188),False)
        d.line((px+34,py+225,px+330,py+225),fill=(50,82,76),width=12); d.line((px+34,py+225,px+250*q,py+225),fill=MINT,width=12)
        txt(d,(px+34,py+268),'MONTHLY HOLDER VALUE',11,(150,179,171)); txt(d,(px+340,py+267),'$38.40',24,WHITE,True,'ra')
    elif t<5.45:
        q=ease((t-3.35)/2.1); txt(d,(70,190),'REWARD COMMITMENT,',54,INK); txt(d,(70,252),'NOT JUST WALLET SIZE.',54,ACC)
        tiers=[('MEMBER','$50+','1 day'),('PLUS','$250+','7 days'),('BLACK','$1,000+','30 days')]
        for i,(name,amt,days) in enumerate(tiers):
            x=70+i*390; y=375-int(16*q*(i+1)); fill=INK if i==2 else WHITE; card(d,(x,y,x+350,y+205),fill)
            txt(d,(x+24,y+32),name,13,MINT if i==2 else ACC); txt(d,(x+24,y+87),amt,34,WHITE if i==2 else INK); txt(d,(x+24,y+125),f'Hold for {days}',15,(170,196,189) if i==2 else MUT,False)
            txt(d,(x+24,y+170),'✓ benefits unlock by tier',13,WHITE if i==2 else INK,False)
    elif t<7.65:
        q=ease((t-5.45)/2.2); txt(d,(70,180),'THE FEE STREAM FUNDS',52,INK); txt(d,(70,242),'THE MEMBERSHIP.',52,ACC)
        boxes=[('TRADING FEES','50 SOL'),('MEMBERSHIP POOL','17.5 SOL'),('HOLDER BENEFITS','61% funded')]
        for i,(a,b) in enumerate(boxes):
            x=70+i*390; y=395; card(d,(x,y,x+330,y+145),WHITE); txt(d,(x+22,y+34),a,12,MUT); txt(d,(x+22,y+90),b,29,INK)
            if i<2:
                xx=x+342; d.line((xx,y+72,xx+34*q,y+72),fill=ACC,width=4); d.polygon([(xx+34*q,y+72),(xx+24*q,y+65),(xx+24*q,y+79)],fill=ACC)
        txt(d,(72,600),'Coverage is public before launch.',17,MUT,False)
    elif t<9.15:
        q=ease((t-7.65)/1.5); txt(d,(70,175),'ONE COIN.',58,INK); txt(d,(70,242),'A STACK OF BENEFITS.',58,ACC)
        items=['Gas','Tools','Security','Credits','Discounts','Access']
        for i,a in enumerate(items):
            x=72+(i%3)*240; y=390+(i//3)*92; card(d,(x,y,x+214,y+70)); d.ellipse((x+16,y+18,x+50,y+52),fill=PALE); txt(d,(x+33,y+35),'✓',18,ACC,True,'mm'); txt(d,(x+64,y+36),a,16,INK,True,'lm')
        card(d,(850,330,1160,560),INK); txt(d,(884,375),'YOUR MEMBERSHIP',12,MINT); txt(d,(884,435),'BLACK',42,WHITE); txt(d,(884,480),'$38.40 / month',18,(176,207,198),False); txt(d,(884,520),'ACTIVE BENEFITS  6',12,WHITE)
    else:
        logo(d,92,215,86); txt(d,(210,258),'MEMBERSHIP',36,INK,True,'lm'); txt(d,(92,375),'HOLD THE COIN.',62,INK); txt(d,(92,446),'UNLOCK THE BENEFITS.',62,ACC)
        txt(d,(95,530),'Coins that pay for things holders actually use.',22,MUT,False)
        rounded(d,(930,224,1158,466),28,INK); txt(d,(1044,293),'M',94,WHITE,True,'mm'); txt(d,(1044,404),'MEMBER',16,MINT,True,'mm')
    return im
for n in range(int(FPS*DUR)):
    scene(n/FPS).save(os.path.join(FR,f'{n:04d}.png'),quality=95)
sr=48000; N=int(DUR*sr); y=np.zeros(N,dtype=np.float64); bpm=96; beat=60/bpm; rng=np.random.default_rng(7)
def add_sine(start,dur,freq,amp,decay=2.5):
    a=int(start*sr); b=min(N,a+int(dur*sr)); tt=np.arange(b-a)/sr; env=np.exp(-tt*decay); y[a:b][:]+=amp*np.sin(2*np.pi*freq*tt)*env
chords=[(0,[110,164.81,220]),(2.5,[98,146.83,196]),(5,[130.81,196,261.63]),(7.5,[110,164.81,220])]
for st,fs in chords:
    a=int(st*sr); b=min(N,int((st+2.8)*sr)); tt=np.arange(b-a)/sr; fade=np.sin(np.pi*np.clip(tt/2.8,0,1))**.7
    for f in fs: y[a:b]+=0.027*np.sin(2*np.pi*f*tt)*fade
for k in np.arange(0,DUR,beat):
    a=int(k*sr); b=min(N,a+int(.22*sr)); tt=np.arange(b-a)/sr; y[a:b]+=0.11*np.sin(2*np.pi*(62-24*tt)*tt)*np.exp(-tt*18)
for k in np.arange(beat/2,DUR,beat):
    a=int(k*sr); b=min(N,a+int(.07*sr)); noise=rng.normal(0,1,b-a); env=np.exp(-np.arange(b-a)/sr*60); y[a:b]+=0.015*noise*env
for st in [1.45,3.35,5.45,7.65,9.15]:
    a=max(0,int((st-.16)*sr)); b=min(N,int((st+.18)*sr)); noise=rng.normal(0,1,b-a); env=np.sin(np.pi*np.linspace(0,1,b-a))**2; y[a:b]+=0.012*noise*env; add_sine(st,.35,520,0.018,6)
m=np.max(np.abs(y)); y=np.tanh(y/(m or 1)*0.8)*0.68; pcm=np.int16(np.clip(y,-1,1)*32767)
audio=os.path.join(OUT,'membership-music.wav')
with wave.open(audio,'wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm.tobytes())
video=os.path.join(OUT,'launch-ad.mp4')
subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate',str(FPS),'-i',os.path.join(FR,'%04d.png'),'-i',audio,'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',video],check=True)
print(video)
