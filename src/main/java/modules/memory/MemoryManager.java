package modules.memory;

import model.Process;
import utils.Logger;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

// Clase base para gestion de memoria virtual
public abstract class MemoryManager {
  
  protected static class Frame { //Desripcion diagrama de clases
      private String processId; //ownerPID
      private int pageNumber; 
      private int loadTime;
      private int lastAccessTime;
      private boolean isOccupied;
      
      public Frame() {
          this.isOccupied = false;
      }
      
      public void load(String pid, int page, int time) {
          this.processId = pid;
          this.pageNumber = page;
          this.loadTime = time;
          this.lastAccessTime = time;
          this.isOccupied = true;
      }
      
      public void unload() {
          this.processId = null;
          this.pageNumber = -1;
          this.isOccupied = false;
      }
      
      public void access(int time) {
          this.lastAccessTime = time;
      }
      //Falta clear, isFree, touch
      // Getters
      public String getProcessId() { return processId; }
      public int getPageNumber() { return pageNumber; }
      public int getLoadTime() { return loadTime; }
      public int getLastAccessTime() { return lastAccessTime; }
      public boolean isOccupied() { return isOccupied; }
      
      @Override
      public String toString() {
          return isOccupied ? 
              String.format("[%s:P%d]", processId, pageNumber) : "[FREE]";
      }
  }
  
  protected final int totalFrames;
  protected final Frame[] frames;
  protected final Map<String, Set<Integer>> processPageMap; // PID Paginas cargadas
  
  protected int currentTime;
  protected int pageFaults;
  protected int pageReplacements;
  protected int totalPageLoads;
  protected int totalAccesses;
  protected int lastPageIn = -1;
  protected int lastPageOut = -1;
  protected String lastRequestedPid = "";
  protected int lastRequestedPage = -1;
  protected boolean lastFault = false;
  
  public MemoryManager(int totalFrames) {
      if (totalFrames <= 0) {
          throw new IllegalArgumentException("Numero de marcos debe ser positivo");
      }
      
      this.totalFrames = totalFrames;
      this.frames = new Frame[totalFrames];
      this.processPageMap = new ConcurrentHashMap<>();
      
      for (int i = 0; i < totalFrames; i++) {
          frames[i] = new Frame();
      }
      
      this.currentTime = 0;
      this.pageFaults = 0;
      this.pageReplacements = 0;
      this.totalPageLoads = 0;
      this.totalAccesses = 0;

      Logger.log("[MEM] MemoryManager inicializado con " + totalFrames + " marcos");
  }
  
  // Intenta cargar una pagina en memoria
  public synchronized boolean loadPage(Process process, int pageNumber) {
      currentTime++;
      totalAccesses++;

      lastRequestedPid = process.getPid();
      lastRequestedPage = pageNumber;

      String pid = process.getPid();

      // Verificar si la pagina ya esta cargada
      if (isPageLoaded(pid, pageNumber)) {
          Logger.debug("[MEM] Pagina " + pageNumber + " del proceso " + pid + " ya esta en memoria");
          lastPageIn = accessPage(pid, pageNumber);
          lastPageOut = -1;
          lastFault = false;
          return true;
      }

      // Page fault
      pageFaults++;
      process.incrementPageFaults();
      lastFault = true;
      Logger.logPageFault(pid, pageNumber, currentTime);
      
      // Buscar marco libre
      int freeFrame = findFreeFrame();
      
      if (freeFrame != -1) {
          // Hay marco libre
          loadPageToFrame(freeFrame, pid, pageNumber);
          lastFault = true;
          return true;
      }
      
      // No hay marco libre, necesitamos reemplazar
      int victimFrame = selectVictimFrame(process, pageNumber);
      
      if (victimFrame != -1) {
          replacePage(victimFrame, pid, pageNumber);
          lastFault = true;
          return true;
      }
      
      Logger.error("[MEM] No se pudo cargar la pagina " + pageNumber + " del proceso " + pid);
      return false;
  }
  
  // Selecciona el marco victima para reemplazo
  protected abstract int selectVictimFrame(Process requestingProcess, int requestedPage);
  
  protected int accessPage(String pid, int pageNumber) {
      for (int i = 0; i < totalFrames; i++) {
          Frame frame = frames[i];
          if (frame.isOccupied() &&
              frame.getProcessId().equals(pid) &&
              frame.getPageNumber() == pageNumber) {
              frame.access(currentTime);
              return i;
          }
      }
      return -1;
  }
  
  // Busca un marco libre
  protected int findFreeFrame() {
      for (int i = 0; i < totalFrames; i++) {
          if (!frames[i].isOccupied()) {
              return i;
          }
      }
      return -1;
  }
  
  // Carga una pagina en un marco especifico
  protected void loadPageToFrame(int frameIndex, String pid, int pageNumber) {
      frames[frameIndex].load(pid, pageNumber, currentTime);

      processPageMap.computeIfAbsent(pid, k -> new HashSet<>()).add(pageNumber);

      totalPageLoads++;
      lastPageIn = frameIndex;
      lastPageOut = -1;
      Logger.debug("[MEM] Pagina " + pageNumber + " del proceso " + pid +
                  " cargada en marco " + frameIndex);
  }
  
  // Reemplaza una pagina en un marco
  protected void replacePage(int frameIndex, String newPid, int newPage) {
      Frame frame = frames[frameIndex];
      String victimPid = frame.getProcessId();
      int victimPage = frame.getPageNumber();
      
      // Remover la pagina victima
      if (processPageMap.containsKey(victimPid)) {
          processPageMap.get(victimPid).remove(victimPage);
      }
      
      // Cargar la nueva pagina
      frame.load(newPid, newPage, currentTime);
      processPageMap.computeIfAbsent(newPid, k -> new HashSet<>()).add(newPage);

      pageReplacements++;
      totalPageLoads++;
      lastPageIn = frameIndex;
      lastPageOut = frameIndex;
      lastFault = true;

      Logger.logPageReplacement(victimPid, victimPage, newPid, newPage, currentTime);
  }
  
  // Verifica si una pagina esta cargada
  public synchronized boolean isPageLoaded(String pid, int pageNumber) {
      return processPageMap.containsKey(pid) && 
              processPageMap.get(pid).contains(pageNumber);
  }
  
  // Obtiene todas las paginas cargadas de un proceso
  public synchronized Set<Integer> getLoadedPages(String pid) {
      return new HashSet<>(processPageMap.getOrDefault(pid, new HashSet<>()));
  }
  
  // Libera todas las paginas de un proceso
  public synchronized void freeProcessPages(String pid) {
      for (int i = 0; i < totalFrames; i++) {
          if (frames[i].isOccupied() && frames[i].getProcessId().equals(pid)) {
              frames[i].unload();
          }
      }
      processPageMap.remove(pid);
      Logger.debug("[MEM] Paginas del proceso " + pid + " liberadas");
  }
  
  // Obtiene el estado actual de los marcos
  public synchronized String getMemoryState() {
      StringBuilder sb = new StringBuilder();
      sb.append("Estado de Memoria:\n");
      for (int i = 0; i < totalFrames; i++) {
          sb.append(String.format("[MEM] Marco %2d: %s\n", i, frames[i]));
      }
      return sb.toString();
  }
  
  // Obtiene marcos libres
  public synchronized int getFreeFrames() {
      int count = 0;
      for (Frame frame : frames) {
          if (!frame.isOccupied()) count++;
      }
      return count;
  }
  
  // Getters para metricas
  public int getPageFaults() {
      return pageFaults;
  }
  
  public int getPageReplacements() {
      return pageReplacements;
  }
  
  public int getTotalPageLoads() {
      return totalPageLoads;
  }

  public int getTotalAccesses() {
      return totalAccesses;
  }
  
  public int getTotalFrames() {
      return totalFrames;
  }
  
  public int getCurrentTime() {
      return currentTime;
  }
  
  public void setCurrentTime(int time) {
      this.currentTime = time;
  }

  public int getLastPageIn() {
      return lastPageIn;
  }

  public int getLastPageOut() {
      return lastPageOut;
  }

  public synchronized MemorySnapshot captureSnapshot() {
      List<MemorySnapshot.FrameState> frameStates = new ArrayList<>();

      for (int i = 0; i < totalFrames; i++) {
          Frame frame = frames[i];
          frameStates.add(
              new MemorySnapshot.FrameState(
                  i,
                  frame.getProcessId(),
                  frame.getPageNumber(),
                  frame.isOccupied(),
                  frame.getLoadTime(),
                  frame.getLastAccessTime()
              )
          );
      }

      return new MemorySnapshot(
          frameStates,
          pageFaults,
          pageReplacements,
          totalPageLoads,
          totalAccesses,
          totalFrames,
          lastPageIn,
          lastPageOut,
          lastRequestedPid,
          lastRequestedPage,
          lastFault
      );
  }
  
  public abstract String getAlgorithmName();
  

  public void printMetrics() {
      Logger.separator();
      Logger.section("[MEM] METRICAS DE MEMORIA - " + getAlgorithmName());
      Logger.log("Total de fallos de pagina: " + pageFaults);
      Logger.log("Total de reemplazos: " + pageReplacements);
      Logger.log("Total de cargas de pagina: " + totalPageLoads);
      Logger.log("Marcos libres: " + getFreeFrames() + "/" + totalFrames);
      Logger.log("Tasa de fallos: " + 
          String.format("%.2f%%", (double) pageFaults / totalPageLoads * 100));
      Logger.separator();
  }

  public synchronized void reset() {
      for (Frame frame : frames) {
          frame.unload();
      }
      processPageMap.clear();
      currentTime = 0;
      pageFaults = 0;
      pageReplacements = 0;
      totalPageLoads = 0;
      totalAccesses = 0;
      lastPageIn = -1;
      lastPageOut = -1;
      lastRequestedPid = "";
      lastRequestedPage = -1;
      lastFault = false;
      Logger.log("[MEM] Memoria reseteada");
  }

  public static class MemorySnapshot {
      private final List<FrameState> frames;
      private final int pageFaults;
      private final int pageReplacements;
      private final int totalPageLoads;
      private final int totalAccesses;
      private final int totalFrames;
      private final int lastPageIn;
      private final int lastPageOut;
      private final String lastRequestedPid;
      private final int lastRequestedPage;
      private final boolean lastFault;

      public MemorySnapshot(List<FrameState> frames, int pageFaults, int pageReplacements,
                            int totalPageLoads, int totalAccesses, int totalFrames,
                            int lastPageIn, int lastPageOut, String lastRequestedPid,
                            int lastRequestedPage, boolean lastFault) {
          this.frames = frames;
          this.pageFaults = pageFaults;
          this.pageReplacements = pageReplacements;
          this.totalPageLoads = totalPageLoads;
          this.totalAccesses = totalAccesses;
          this.totalFrames = totalFrames;
          this.lastPageIn = lastPageIn;
          this.lastPageOut = lastPageOut;
          this.lastRequestedPid = lastRequestedPid;
          this.lastRequestedPage = lastRequestedPage;
          this.lastFault = lastFault;
      }

      public List<FrameState> getFrames() {
          return frames;
      }

      public int getPageFaults() {
          return pageFaults;
      }

      public int getPageReplacements() {
          return pageReplacements;
      }

      public int getTotalPageLoads() {
          return totalPageLoads;
      }

      public int getTotalAccesses() {
          return totalAccesses;
      }

      public int getTotalFrames() {
          return totalFrames;
      }

      public int getLastPageIn() {
          return lastPageIn;
      }

      public int getLastPageOut() {
          return lastPageOut;
      }

      public String getLastRequestedPid() {
          return lastRequestedPid;
      }

      public int getLastRequestedPage() {
          return lastRequestedPage;
      }

      public boolean isLastFault() {
          return lastFault;
      }

      public record FrameState(int index, String processId, int pageNumber,
                               boolean occupied, int loadTime, int lastAccess) {}
  }
}