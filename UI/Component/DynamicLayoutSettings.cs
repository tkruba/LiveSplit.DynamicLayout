using System;
using System.Drawing;
using System.Net.Sockets;
using System.Net;
using System.Windows.Forms;
using System.Xml;

namespace LiveSplit.UI.Components
{
    public partial class DynamicLayoutSettings : UserControl
    {
        public LayoutMode Mode { get; set; }
		
		public ushort Port { get; set; }

		public string LocalIP { get; set; }

		public string GetIP()
		{
			IPAddress[] ipv4Addresses = Array.FindAll(
				Dns.GetHostEntry(string.Empty).AddressList,
				a => a.AddressFamily == AddressFamily.InterNetwork);

			return String.Join(",", Array.ConvertAll(ipv4Addresses, x => x.ToString()));
		}

		public string PortString
		{
			get { return Port.ToString(); }
			set {
				Port = ushort.Parse(value);
				curlabel.Text = "Current: " + PortString;
				txtPort.Text = PortString;
				restartServer();
			}
		}

		private Action restartServer;

		public DynamicLayoutSettings(Action restartServer)
        {
			InitializeComponent();
			Port = 8085;
			txtPort.Text = PortString;
			curlabel.Text = "Current: " + PortString;
			LocalIP = GetIP();
			iplist.Text = LocalIP;
			this.restartServer = restartServer;

			// txtPort.DataBindings.Add("Text", this, "PortString", false, DataSourceUpdateMode.OnPropertyChanged);
		}

        public void SetSettings(XmlNode node)
        {
			var element = (XmlElement)node;
			PortString = SettingsHelper.ParseString(element["Port"]);
		}

        public XmlNode GetSettings(XmlDocument document)
        {
            var parent = document.CreateElement("Settings");
            CreateSettingsNode(document, parent);
            return parent;
        }

        public int GetSettingsHashCode()
        {
            return CreateSettingsNode(null, null);
        }

        private int CreateSettingsNode(XmlDocument document, XmlElement parent)
        {
            return SettingsHelper.CreateSetting(document, parent, "Port", PortString);
        }

		private void portbtn_Click(object sender, EventArgs e)
		{
			PortString = txtPort.Text;
		}
	}
}
