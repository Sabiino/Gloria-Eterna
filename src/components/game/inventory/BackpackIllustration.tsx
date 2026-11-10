import { Image, StyleSheet, Text, View } from 'react-native';
import { gameColors } from '@/theme/gameColors';
const levelOne = require('../../../assets/game/inventory/backpack-level-1-hero.png');

export function BackpackIllustration({ level }: { level: number }) {
  return <View style={styles.wrap}><View pointerEvents="none" style={styles.glow}/><Image source={levelOne} resizeMode="contain" style={styles.art}/><View style={styles.copyWrap}><Text style={styles.eyebrow}>EQUIPAMENTO DE EXPEDIÇÃO</Text><Text style={styles.title}>MOCHILA NÍVEL {level}</Text><Text style={styles.copy}>Organizada e pronta para sua próxima jornada.</Text></View></View>;
}

const styles=StyleSheet.create({wrap:{flex:1,minHeight:218,padding:12,borderRadius:22,backgroundColor:'rgba(4,42,33,.87)',borderWidth:1.5,borderColor:'rgba(229,179,78,.75)',flexDirection:'row',alignItems:'center',overflow:'hidden'},glow:{position:'absolute',width:250,height:250,borderRadius:125,backgroundColor:'rgba(255,216,117,.14)',left:-86,top:-65},art:{width:'57%',height:214,marginLeft:-19},copyWrap:{flex:1,minWidth:104,gap:4,paddingRight:4},eyebrow:{color:gameColors.gold,fontWeight:'900',fontSize:9,letterSpacing:.7},title:{color:gameColors.cream,fontWeight:'900',fontSize:18,lineHeight:22},copy:{color:gameColors.muted,fontSize:11,lineHeight:16}});
